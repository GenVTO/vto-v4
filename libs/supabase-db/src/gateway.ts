import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CreateJobInput,
  CreditEventInput,
  CreditSnapshot,
  DbGateway,
  TryOnJobEventInput,
  TryOnHistoryQuery,
  TryOnJob,
} from '@vto/types'

import { createLogger } from '@vto/logger'

import type { ApiKeyRow as ApiKeyTableRow, TenantRow, TryOnJobRow } from './types'

export interface SupabaseDbOptions {
  schema?: string
}

interface ApiKeyValidationRow extends Pick<ApiKeyTableRow, 'is_active' | 'tenant_id'> {
  tenants: { shop_domain: string } | { shop_domain: string }[] | null
}

interface CreditSnapshotRow {
  available_credits: number
  completed_consumed_count: number
  failed_charged_count: number
  in_flight_reserved_count: number
  refunded_credits: number
  reserved_or_spent_credits: number
}

const supabaseDbLogger = createLogger({ service: '@vto/supabase-db' })

function toTenantsRelation(
  relation: ApiKeyValidationRow['tenants'],
): { shop_domain: string } | null {
  if (!relation) {
    return null
  }
  return Array.isArray(relation) ? (relation[0] ?? null) : relation
}

export class SupabaseDbGateway implements DbGateway {
  private readonly client: SupabaseClient
  private readonly options: SupabaseDbOptions

  constructor(client: SupabaseClient, options: SupabaseDbOptions = {}) {
    this.client = client
    this.options = options
    supabaseDbLogger.info('Supabase db gateway initialized', {
      schema: options.schema ?? null,
    })
  }

  private from(table: string): ReturnType<SupabaseClient['from']> {
    const schema = this.options.schema?.trim()
    return schema ? this.client.schema(schema).from(table) : this.client.from(table)
  }

  private toTryOnJob(row: TryOnJobRow): TryOnJob {
    return {
      created_at: row.created_at,
      credits_charged: row.credits_charged,
      customer_id: row.customer_id,
      id: row.id,
      model: row.model,
      product_id: row.product_id,
      provider_job_id: row.provider_job_id,
      result_url: row.result_url,
      shop_domain: row.shop_domain,
      shopify_product_handle: row.shopify_product_handle,
      status: row.status,
      updated_at: row.updated_at,
      user_image_hash: row.user_image_hash,
      visitor_id: row.visitor_id,
    }
  }

  async validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null> {
    const { data, error } = await this.from('api_keys')
      .select('tenant_id,is_active,tenants(shop_domain)')
      .eq('key_hash', apiKey)
      .eq('is_active', true)
      .maybeSingle<ApiKeyValidationRow>()

    if (error) {
      supabaseDbLogger.error('validateApiKey failed', { message: error.message })
      throw new Error(error.message)
    }

    if (!data || !data.is_active) {
      return null
    }

    const tenant = toTenantsRelation(data.tenants)
    if (!tenant?.shop_domain) {
      return null
    }

    return {
      shopDomain: tenant.shop_domain,
      tenantId: data.tenant_id,
    }
  }

  async hasCredits(tenantId: string): Promise<boolean> {
    return (await this.getCreditBalance(tenantId)) > 0
  }

  async getCreditBalance(tenantId: string): Promise<number> {
    const snapshot = await this.getCreditSnapshot(tenantId)
    return snapshot.availableCredits
  }

  async getCreditSnapshot(tenantId: string): Promise<CreditSnapshot> {
    const { data, error } = await this.from('tenant_credit_snapshot_v')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle<CreditSnapshotRow>()

    if (error) {
      if (error.message.includes('tenant_credit_snapshot_v')) {
        const { data: ledgerData, error: ledgerError } = await this.from('credit_ledgers')
          .select('amount_credits')
          .eq('tenant_id', tenantId)
          .returns<{ amount_credits: number }[]>()

        if (ledgerError) {
          supabaseDbLogger.error('getCreditSnapshot fallback failed', {
            message: ledgerError.message,
            tenant_id: tenantId,
          })
          throw new Error(ledgerError.message)
        }

        return {
          availableCredits: (ledgerData ?? []).reduce((sum, row) => sum + row.amount_credits, 0),
          completedConsumedCount: 0,
          failedChargedCount: 0,
          inFlightReservedCount: 0,
          refundedCredits: 0,
          reservedOrSpentCredits: 0,
        }
      }
      supabaseDbLogger.error('getCreditSnapshot failed', {
        message: error.message,
        tenant_id: tenantId,
      })
      throw new Error(error.message)
    }

    return {
      availableCredits: data?.available_credits ?? 0,
      completedConsumedCount: data?.completed_consumed_count ?? 0,
      failedChargedCount: data?.failed_charged_count ?? 0,
      inFlightReservedCount: data?.in_flight_reserved_count ?? 0,
      refundedCredits: data?.refunded_credits ?? 0,
      reservedOrSpentCredits: data?.reserved_or_spent_credits ?? 0,
    }
  }

  async listTenants(): Promise<{ tenantId: string; shopDomain: string }[]> {
    const { data, error } = await this.from('tenants')
      .select('id,shop_domain')
      .order('created_at', { ascending: false })
      .returns<TenantRow[]>()

    if (error) {
      supabaseDbLogger.error('listTenants failed', { message: error.message })
      throw new Error(error.message)
    }

    return (data ?? []).map((tenant) => ({
      shopDomain: tenant.shop_domain,
      tenantId: tenant.id,
    }))
  }

  async reserveCreditForJob(tenantId: string, jobId: string): Promise<void> {
    const { error } = await this.client.rpc('reserve_credit_for_job', {
      p_job_id: jobId,
      p_tenant_id: tenantId,
    })

    if (error) {
      if (error.message.includes('NO_CREDITS')) {
        throw new Error('No credits')
      }
      supabaseDbLogger.error('reserveCreditForJob failed', {
        job_id: jobId,
        message: error.message,
        tenant_id: tenantId,
      })
      throw new Error(error.message)
    }
  }

  async recordCreditEvent(input: CreditEventInput): Promise<void> {
    const { error } = await this.from('credit_ledgers').insert({
      amount_credits: input.amountCredits,
      amount_usd: input.amountUsd ?? null,
      event_type: input.eventType,
      metadata: input.metadata ?? {},
      tenant_id: input.tenantId,
    })

    if (error) {
      supabaseDbLogger.error('recordCreditEvent failed', { message: error.message })
      throw new Error(error.message)
    }
  }

  async findCachedResult(input: {
    shopDomain: string
    productId: string
    userImageHash: string
  }): Promise<TryOnJob | null> {
    const { data, error } = await this.from('tryon_jobs')
      .select('*')
      .eq('shop_domain', input.shopDomain)
      .eq('product_id', input.productId)
      .eq('user_image_hash', input.userImageHash)
      .eq('status', 'completed')
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<TryOnJobRow[]>()

    if (error) {
      supabaseDbLogger.error('findCachedResult failed', { message: error.message })
      throw new Error(error.message)
    }

    const row = data?.[0]
    return row ? this.toTryOnJob(row) : null
  }

  async findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null> {
    const { data, error } = await this.from('tryon_jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('idempotency_key', key)
      .order('created_at', { ascending: false })
      .limit(1)
      .returns<TryOnJobRow[]>()

    if (error) {
      supabaseDbLogger.error('findJobByIdempotency failed', { message: error.message })
      throw new Error(error.message)
    }

    const row = data?.[0]
    return row ? this.toTryOnJob(row) : null
  }

  async saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void> {
    const { error } = await this.from('tryon_jobs')
      .update({ idempotency_key: key })
      .eq('id', jobId)
      .eq('tenant_id', tenantId)

    if (error) {
      supabaseDbLogger.error('saveJobIdempotency failed', { message: error.message })
      throw new Error(error.message)
    }
  }

  async createJob(input: CreateJobInput): Promise<TryOnJob> {
    const now = new Date().toISOString()
    const { data, error } = await this.from('tryon_jobs')
      .insert({
        created_at: now,
        credits_charged: 0,
        customer_id: input.customer_id ?? null,
        idempotency_key: input.idempotency_key ?? null,
        model: input.model ?? 'advanced',
        product_id: input.product_id,
        provider_job_id: null,
        result_url: null,
        shop_domain: input.shop_domain,
        status: 'queued',
        tenant_id: input.tenantId,
        updated_at: now,
        user_image_hash: input.userImageHash,
        visitor_id: input.visitor_id,
      })
      .select('*')
      .single<TryOnJobRow>()

    if (error || !data) {
      supabaseDbLogger.error('createJob failed', { message: error?.message })
      throw new Error(error?.message ?? 'Failed to create job')
    }

    return this.toTryOnJob(data)
  }

  async recordJobEvent(input: TryOnJobEventInput): Promise<void> {
    const { error } = await this.from('tryon_job_events').insert({
      event_type: input.eventType,
      job_id: input.jobId,
      metadata: input.metadata ?? {},
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      tenant_id: input.tenantId,
    })

    if (error) {
      supabaseDbLogger.error('recordJobEvent failed', { message: error.message })
      throw new Error(error.message)
    }
  }

  private buildUpdatePayload(input: {
    status: TryOnJob['status']
    providerJobId?: string
    resultUrl?: string
    errorCode?: string
    errorMessage?: string
  }): Record<string, unknown> {
    const updates: Record<string, unknown> = {
      status: input.status,
      updated_at: new Date().toISOString(),
    }

    if (input.providerJobId !== undefined) {
      updates.provider_job_id = input.providerJobId
      updates.credits_charged = 1
    }
    if (input.resultUrl !== undefined) {
      updates.result_url = input.resultUrl
    }
    if (input.errorCode !== undefined) {
      updates.failure_reason_normalized = input.errorCode
    }
    if (input.errorMessage !== undefined) {
      updates.failure_reason_message = input.errorMessage
    }

    return updates
  }

  async updateJobStatus(input: {
    jobId: string
    status: TryOnJob['status']
    providerJobId?: string
    resultUrl?: string
    errorCode?: string
    errorMessage?: string
  }): Promise<void> {
    const updates = this.buildUpdatePayload(input)

    const { error } = await this.from('tryon_jobs').update(updates).eq('id', input.jobId)

    if (error) {
      supabaseDbLogger.error('updateJobStatus failed', { message: error.message })
      throw new Error(error.message)
    }
  }

  async getJob(jobId: string): Promise<TryOnJob | null> {
    const { data, error } = await this.from('tryon_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle<TryOnJobRow>()

    if (error) {
      supabaseDbLogger.error('getJob failed', { message: error.message })
      throw new Error(error.message)
    }

    return data ? this.toTryOnJob(data) : null
  }

  private buildHistoryQueries(query: TryOnHistoryQuery) {
    const limit = query.limit ?? 10
    const offset = query.offset ?? 0

    let countQuery = this.from('tryon_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('shop_domain', query.shop_domain)

    let itemsQuery = this.from('tryon_jobs')
      .select('*')
      .eq('shop_domain', query.shop_domain)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query.visitor_id) {
      countQuery = countQuery.eq('visitor_id', query.visitor_id)
      itemsQuery = itemsQuery.eq('visitor_id', query.visitor_id)
    }

    if (query.product_id) {
      countQuery = countQuery.eq('product_id', query.product_id)
      itemsQuery = itemsQuery.eq('product_id', query.product_id)
    }

    return { countQuery, itemsQuery }
  }

  async getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }> {
    const { countQuery, itemsQuery } = this.buildHistoryQueries(query)

    const [{ count, error: countError }, { data, error: itemsError }] = await Promise.all([
      countQuery,
      itemsQuery.returns<TryOnJobRow[]>(),
    ])

    if (countError) {
      throw new Error(countError.message)
    }
    if (itemsError) {
      throw new Error(itemsError.message)
    }

    const items = (data ?? []).map((row) => this.toTryOnJob(row))
    const jobIds = items.map((job) => job.id)

    if (jobIds.length > 0) {
      const { data: eventsData, error: eventsError } = await this.from('tryon_job_events')
        .select('*')
        .in('job_id', jobIds)
        .order('occurred_at', { ascending: true })

      if (eventsError) {
        supabaseDbLogger.warn('Failed to fetch job events for history', {
          error: eventsError.message,
        })
      } else {
        const eventsByJobId = new Map<string, any[]>()
        for (const event of eventsData ?? []) {
          if (!eventsByJobId.has(event.job_id)) {
            eventsByJobId.set(event.job_id, [])
          }
          eventsByJobId.get(event.job_id)?.push(event)
        }

        for (const item of items) {
          item.events = eventsByJobId.get(item.id) ?? []
        }
      }
    }

    return {
      items,
      total: count ?? 0,
    }
  }
}

export function createSupabaseDbGateway(
  client: SupabaseClient,
  options?: SupabaseDbOptions,
): DbGateway {
  return new SupabaseDbGateway(client, options)
}

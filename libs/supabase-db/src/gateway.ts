import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreditEventInput, CreateJobInput, DbGateway } from '@vto/db/contracts'
import type { TryOnHistoryQuery, TryOnJob } from '@vto/types'

import { createLogger } from '@vto/logger'

export interface SupabaseDbOptions {
  schema?: string
}

interface ApiKeyRow {
  tenant_id: string
  is_active: boolean
  tenants: { shop_domain: string } | { shop_domain: string }[] | null
}

interface CreditLedgerRow {
  amount_credits: number
}

interface TryOnJobRow {
  id: string
  shop_domain: string
  product_id: string
  shopify_product_handle: string | null
  visitor_id: string
  customer_id: string | null
  model: 'normal' | 'advanced'
  status: TryOnJob['status']
  result_url: string | null
  user_image_hash: string
  credits_charged: number
  provider_job_id: string | null
  created_at: string
  updated_at: string
}

const supabaseDbLogger = createLogger({ service: '@vto/supabase-db' })

function toTenantsRelation(relation: ApiKeyRow['tenants']): { shop_domain: string } | null {
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
      .maybeSingle<ApiKeyRow>()

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
    const { data, error } = await this.from('credit_ledgers')
      .select('amount_credits')
      .eq('tenant_id', tenantId)
      .returns<CreditLedgerRow[]>()

    if (error) {
      supabaseDbLogger.error('hasCredits failed', { message: error.message, tenant_id: tenantId })
      throw new Error(error.message)
    }

    const total = (data ?? []).reduce((sum, row) => sum + row.amount_credits, 0)
    return total > 0
  }

  async reserveCredit(tenantId: string): Promise<void> {
    const hasCredits = await this.hasCredits(tenantId)
    if (!hasCredits) {
      throw new Error('No credits')
    }

    const { error } = await this.from('credit_ledgers').insert({
      amount_credits: -1,
      event_type: 'debit_tryon',
      metadata: { source: 'reserveCredit' },
      tenant_id: tenantId,
    })

    if (error) {
      supabaseDbLogger.error('reserveCredit failed', {
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

  async updateJobStatus(input: {
    jobId: string
    status: TryOnJob['status']
    providerJobId?: string
    resultUrl?: string
    errorCode?: string
    errorMessage?: string
  }): Promise<void> {
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

  async getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }> {
    const limit = query.limit ?? 10
    const offset = query.offset ?? 0

    let countQuery = this.from('tryon_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('shop_domain', query.shop_domain)
      .eq('visitor_id', query.visitor_id)

    let itemsQuery = this.from('tryon_jobs')
      .select('*')
      .eq('shop_domain', query.shop_domain)
      .eq('visitor_id', query.visitor_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query.product_id) {
      countQuery = countQuery.eq('product_id', query.product_id)
      itemsQuery = itemsQuery.eq('product_id', query.product_id)
    }

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

    return {
      items: (data ?? []).map((row) => this.toTryOnJob(row)),
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

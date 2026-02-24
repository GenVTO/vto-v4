import type { Client } from '@libsql/client'
import type {
  CreditEventInput,
  CreateJobInput,
  CreditSnapshot,
  DbGateway,
  TryOnJobEventInput,
  TryOnHistoryQuery,
  TryOnJob,
} from '@vto/types'

import { createClient } from '@libsql/client'
import { createLogger } from '@vto/logger'
// oxlint-disable-next-line import/no-nodejs-modules
import { readdir, readFile } from 'node:fs/promises'
// oxlint-disable-next-line import/no-nodejs-modules
import { join } from 'node:path'

const sqliteLogger = createLogger({ service: '@vto/sqlite-db' })

export interface SqliteSeedTenant {
  tenantId: string
  shopDomain: string
  apiKey: string
  credits: number
}

export interface SqliteDbGatewayOptions {
  authToken?: string
  migrationDir?: string
  seedTenants?: SqliteSeedTenant[]
  url: string
}

interface CreditSnapshotRow {
  available_credits: number
  completed_consumed_count: number
  failed_charged_count: number
  in_flight_reserved_count: number
  refunded_credits: number
  reserved_or_spent_credits: number
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return asString(value)
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toTryOnJob(row: Record<string, unknown>): TryOnJob {
  return {
    created_at: asString(row.created_at),
    credits_charged: asNumber(row.credits_charged),
    customer_id: asNullableString(row.customer_id),
    id: asString(row.id),
    model: asString(row.model) as TryOnJob['model'],
    product_id: asString(row.product_id),
    provider_job_id: asNullableString(row.provider_job_id),
    result_url: asNullableString(row.result_url),
    shop_domain: asString(row.shop_domain),
    shopify_product_handle: asNullableString(row.shopify_product_handle),
    status: asString(row.status) as TryOnJob['status'],
    updated_at: asString(row.updated_at),
    user_image_hash: asString(row.user_image_hash),
    visitor_id: asString(row.visitor_id),
  }
}

async function splitStatements(sql: string): Promise<string[]> {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

async function applyMigrations(client: Client, migrationDir: string): Promise<void> {
  const files = (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).toSorted()
  for (const file of files) {
    const sql = await readFile(join(migrationDir, file), 'utf8')
    const statements = await splitStatements(sql)
    for (const statement of statements) {
      await client.execute(statement)
    }
  }
}

async function seedTenantIfMissing(client: Client, tenant: SqliteSeedTenant): Promise<void> {
  const now = new Date().toISOString()

  await client.execute({
    args: [tenant.tenantId, tenant.shopDomain, now, now],
    sql: `
      insert into tenants (id, shop_domain, app_installed, created_at, updated_at)
      values (?, ?, 1, ?, ?)
      on conflict(id) do update set shop_domain=excluded.shop_domain, updated_at=excluded.updated_at
    `,
  })

  await client.execute({
    args: [crypto.randomUUID(), tenant.tenantId, tenant.apiKey, now, now],
    sql: `
      insert into api_keys (id, tenant_id, key_hash, is_active, created_at, updated_at)
      values (?, ?, ?, 1, ?, ?)
      on conflict(key_hash) do update set tenant_id=excluded.tenant_id, is_active=1, updated_at=excluded.updated_at
    `,
  })

  const currentTopup = await client.execute({
    args: [tenant.tenantId],
    sql: `
      select coalesce(sum(amount_credits), 0) as balance
      from credit_ledgers
      where tenant_id = ?
    `,
  })
  const balance = asNumber(currentTopup.rows[0]?.balance)
  const delta = tenant.credits - balance
  if (delta !== 0) {
    await client.execute({
      args: [crypto.randomUUID(), tenant.tenantId, delta, JSON.stringify({ source: 'seed' }), now],
      sql: `
        insert into credit_ledgers (id, tenant_id, event_type, amount_credits, metadata, created_at)
        values (?, ?, 'topup', ?, ?, ?)
      `,
    })
  }
}

export class SqliteDbGateway implements DbGateway {
  private readonly client: Client
  private readonly ready: Promise<void>

  constructor(options: SqliteDbGatewayOptions) {
    const client = createClient({
      authToken: options.authToken,
      url: options.url,
    })
    this.client = client

    const migrationDir = options.migrationDir ?? join(process.cwd(), 'libs/sqlite-db/migrations')

    this.ready = (async () => {
      await applyMigrations(client, migrationDir)
      for (const tenant of options.seedTenants ?? []) {
        await seedTenantIfMissing(client, tenant)
      }
    })()

    sqliteLogger.info('SQLite db gateway initialized', {
      migration_dir: migrationDir,
      seeded_tenants: options.seedTenants?.length ?? 0,
      url: options.url,
    })
  }

  private async ensureReady(): Promise<void> {
    await this.ready
  }

  async validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null> {
    await this.ensureReady()
    const result = await this.client.execute({
      args: [apiKey],
      sql: `
        select a.tenant_id, t.shop_domain
        from api_keys a
        join tenants t on t.id = a.tenant_id
        where a.key_hash = ? and a.is_active = 1
        limit 1
      `,
    })
    const row = result.rows[0] as Record<string, unknown> | undefined
    if (!row) {
      return null
    }
    return {
      shopDomain: asString(row.shop_domain),
      tenantId: asString(row.tenant_id),
    }
  }

  async hasCredits(tenantId: string): Promise<boolean> {
    return (await this.getCreditBalance(tenantId)) > 0
  }

  async getCreditBalance(tenantId: string): Promise<number> {
    return (await this.getCreditSnapshot(tenantId)).availableCredits
  }

  async getCreditSnapshot(tenantId: string): Promise<CreditSnapshot> {
    await this.ensureReady()
    const result = await this.client.execute({
      args: [tenantId],
      sql: `
        select *
        from tenant_credit_snapshot_v
        where tenant_id = ?
        limit 1
      `,
    })

    const row = result.rows[0] as Record<string, unknown> | undefined
    const snapshot: CreditSnapshotRow = {
      available_credits: asNumber(row?.available_credits),
      completed_consumed_count: asNumber(row?.completed_consumed_count),
      failed_charged_count: asNumber(row?.failed_charged_count),
      in_flight_reserved_count: asNumber(row?.in_flight_reserved_count),
      refunded_credits: asNumber(row?.refunded_credits),
      reserved_or_spent_credits: asNumber(row?.reserved_or_spent_credits),
    }

    return {
      availableCredits: snapshot.available_credits,
      completedConsumedCount: snapshot.completed_consumed_count,
      failedChargedCount: snapshot.failed_charged_count,
      inFlightReservedCount: snapshot.in_flight_reserved_count,
      refundedCredits: snapshot.refunded_credits,
      reservedOrSpentCredits: snapshot.reserved_or_spent_credits,
    }
  }

  async listTenants(): Promise<{ tenantId: string; shopDomain: string }[]> {
    await this.ensureReady()
    const result = await this.client.execute(
      `select id, shop_domain from tenants order by created_at desc`,
    )
    return result.rows.map((row) => {
      const record = row as Record<string, unknown>
      return {
        shopDomain: asString(record.shop_domain),
        tenantId: asString(record.id),
      }
    })
  }

  async reserveCreditForJob(tenantId: string, jobId: string): Promise<void> {
    await this.ensureReady()
    await this.client.execute('begin immediate')
    try {
      const balanceResult = await this.client.execute({
        args: [tenantId],
        sql: 'select coalesce(sum(amount_credits), 0) as balance from credit_ledgers where tenant_id = ?',
      })
      const balance = asNumber(balanceResult.rows[0]?.balance)
      if (balance <= 0) {
        await this.client.execute('rollback')
        throw new Error('No credits')
      }

      await this.client.execute({
        args: [
          crypto.randomUUID(),
          tenantId,
          JSON.stringify({ job_id: jobId, source: 'reserveCreditForJob' }),
          new Date().toISOString(),
        ],
        sql: `
          insert into credit_ledgers (id, tenant_id, event_type, amount_credits, metadata, created_at)
          values (?, ?, 'debit_tryon', -1, ?, ?)
        `,
      })
      await this.client.execute('commit')
    } catch (error) {
      try {
        await this.client.execute('rollback')
      } catch {
        // Ignore rollback failures
      }
      throw error
    }
  }

  async recordCreditEvent(input: CreditEventInput): Promise<void> {
    await this.ensureReady()
    await this.client.execute({
      args: [
        crypto.randomUUID(),
        input.tenantId,
        input.eventType,
        input.amountCredits,
        input.amountUsd ?? null,
        JSON.stringify(input.metadata ?? {}),
        new Date().toISOString(),
      ],
      sql: `
        insert into credit_ledgers (id, tenant_id, event_type, amount_credits, amount_usd, metadata, created_at)
        values (?, ?, ?, ?, ?, ?, ?)
      `,
    })
  }

  async findCachedResult(input: {
    shopDomain: string
    productId: string
    userImageHash: string
  }): Promise<TryOnJob | null> {
    await this.ensureReady()
    const result = await this.client.execute({
      args: [input.shopDomain, input.productId, input.userImageHash],
      sql: `
        select *
        from tryon_jobs
        where shop_domain = ?
          and product_id = ?
          and user_image_hash = ?
          and status = 'completed'
          and result_url is not null
        order by created_at desc
        limit 1
      `,
    })

    const row = result.rows[0] as Record<string, unknown> | undefined
    return row ? toTryOnJob(row) : null
  }

  async findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null> {
    await this.ensureReady()
    const result = await this.client.execute({
      args: [tenantId, key],
      sql: `
        select *
        from tryon_jobs
        where tenant_id = ? and idempotency_key = ?
        order by created_at desc
        limit 1
      `,
    })

    const row = result.rows[0] as Record<string, unknown> | undefined
    return row ? toTryOnJob(row) : null
  }

  async saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void> {
    await this.ensureReady()
    await this.client.execute({
      args: [key, new Date().toISOString(), jobId, tenantId],
      sql: `
        update tryon_jobs
        set idempotency_key = ?, updated_at = ?
        where id = ? and tenant_id = ?
      `,
    })
  }

  async createJob(input: CreateJobInput): Promise<TryOnJob> {
    await this.ensureReady()
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await this.client.execute({
      args: [
        id,
        input.tenantId,
        input.idempotency_key ?? null,
        input.shop_domain,
        input.product_id,
        input.visitor_id,
        input.customer_id ?? null,
        input.model ?? 'advanced',
        input.userImageHash,
        now,
        now,
      ],
      sql: `
        insert into tryon_jobs (
          id, tenant_id, idempotency_key, shop_domain, product_id,
          visitor_id, customer_id, model, status, provider_job_id,
          user_image_hash, result_url, credits_charged,
          created_at, updated_at
        ) values (
          ?, ?, ?, ?, ?,
          ?, ?, ?, 'queued', null,
          ?, null, 0,
          ?, ?
        )
      `,
    })

    const created = await this.getJob(id)
    if (!created) {
      throw new Error('Failed to create job')
    }
    return created
  }

  async recordJobEvent(input: TryOnJobEventInput): Promise<void> {
    await this.ensureReady()
    await this.client.execute({
      args: [
        crypto.randomUUID(),
        input.tenantId,
        input.jobId,
        input.eventType,
        JSON.stringify(input.metadata ?? {}),
        input.occurredAt ?? new Date().toISOString(),
      ],
      sql: `
        insert into tryon_job_events (id, tenant_id, job_id, event_type, metadata, occurred_at)
        values (?, ?, ?, ?, ?, ?)
      `,
    })
  }

  async updateJobStatus(input: {
    jobId: string
    status: TryOnJob['status']
    providerJobId?: string
    resultUrl?: string
    errorCode?: string
    errorMessage?: string
  }): Promise<void> {
    await this.ensureReady()

    const updates: string[] = ['status = ?', 'updated_at = ?']
    const args: (string | number | null)[] = [input.status, new Date().toISOString()]

    if (input.providerJobId !== undefined) {
      updates.push('provider_job_id = ?', 'credits_charged = 1')
      args.push(input.providerJobId)
    }
    if (input.resultUrl !== undefined) {
      updates.push('result_url = ?')
      args.push(input.resultUrl)
    }
    if (input.errorCode !== undefined) {
      updates.push('failure_reason_normalized = ?')
      args.push(input.errorCode)
    }
    if (input.errorMessage !== undefined) {
      updates.push('failure_reason_message = ?')
      args.push(input.errorMessage)
    }

    args.push(input.jobId)
    await this.client.execute({
      args,
      sql: `update tryon_jobs set ${updates.join(', ')} where id = ?`,
    })
  }

  async getJob(jobId: string): Promise<TryOnJob | null> {
    await this.ensureReady()
    const result = await this.client.execute({
      args: [jobId],
      sql: 'select * from tryon_jobs where id = ? limit 1',
    })
    const row = result.rows[0] as Record<string, unknown> | undefined
    return row ? toTryOnJob(row) : null
  }

  async getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }> {
    await this.ensureReady()
    const limit = query.limit ?? 10
    const offset = query.offset ?? 0

    const where: string[] = ['shop_domain = ?']
    const args: (string | number | null)[] = [query.shop_domain]

    if (query.visitor_id) {
      where.push('visitor_id = ?')
      args.push(query.visitor_id)
    }
    if (query.product_id) {
      where.push('product_id = ?')
      args.push(query.product_id)
    }

    const whereSql = where.join(' and ')

    const countResult = await this.client.execute({
      args,
      sql: `select count(*) as total from tryon_jobs where ${whereSql}`,
    })
    const total = asNumber(countResult.rows[0]?.total)

    const itemsResult = await this.client.execute({
      args: [...args, limit, offset] as (string | number | null)[],
      sql: `
        select *
        from tryon_jobs
        where ${whereSql}
        order by created_at desc
        limit ? offset ?
      `,
    })

    const items = itemsResult.rows.map((row) => toTryOnJob(row as Record<string, unknown>))
    const jobIds = items.map((item) => item.id)

    if (jobIds.length > 0) {
      const placeholders = jobIds.map(() => '?').join(',')
      const eventsResult = await this.client.execute({
        args: jobIds,
        sql: `
          select *
          from tryon_job_events
          where job_id in (${placeholders})
          order by occurred_at asc
        `,
      })

      const eventsByJobId = new Map<string, any[]>()
      for (const row of eventsResult.rows) {
        const jobId = asString(row.job_id)
        if (!eventsByJobId.has(jobId)) {
          eventsByJobId.set(jobId, [])
        }
        eventsByJobId.get(jobId)?.push({
          event_type: asString(row.event_type),
          id: asString(row.id),
          job_id: jobId,
          metadata: row.metadata ? JSON.parse(asString(row.metadata)) : undefined,
          occurred_at: asString(row.occurred_at),
        })
      }

      for (const item of items) {
        item.events = eventsByJobId.get(item.id) ?? []
      }
    }

    return {
      items,
      total,
    }
  }
}

export function createSqliteDbGateway(options: SqliteDbGatewayOptions): DbGateway {
  return new SqliteDbGateway(options)
}

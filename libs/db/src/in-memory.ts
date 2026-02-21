import type { TryOnHistoryQuery, TryOnJob } from '@vto/types'

import type { CreditEventInput, CreateJobInput, DbGateway } from './contracts'

const DEFAULT_HISTORY_LIMIT = 10

export interface InMemoryTenant {
  tenantId: string
  shopDomain: string
  apiKey: string
  credits: number
}

export interface InMemoryDbOptions {
  seedTenants?: InMemoryTenant[]
}

function byCreatedAtDesc(leftJob: TryOnJob, rightJob: TryOnJob): number {
  return rightJob.created_at.localeCompare(leftJob.created_at)
}

export class InMemoryDbGateway implements DbGateway {
  private readonly tenants = new Map<string, InMemoryTenant>()
  private readonly keyToTenant = new Map<string, string>()
  private readonly jobs = new Map<string, TryOnJob>()
  private readonly idempotency = new Map<string, string>()
  private readonly creditEvents: CreditEventInput[] = []

  constructor(options: InMemoryDbOptions = {}) {
    for (const tenant of options.seedTenants ?? []) {
      this.tenants.set(tenant.tenantId, tenant)
      this.keyToTenant.set(tenant.apiKey, tenant.tenantId)
    }
  }

  validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null> {
    const tenantId = this.keyToTenant.get(apiKey)
    if (!tenantId) {
      return Promise.resolve(null)
    }

    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      return Promise.resolve(null)
    }

    return Promise.resolve({ shopDomain: tenant.shopDomain, tenantId })
  }

  hasCredits(tenantId: string): Promise<boolean> {
    const tenant = this.tenants.get(tenantId)
    return Promise.resolve(Boolean(tenant && tenant.credits > 0))
  }

  reserveCredit(tenantId: string): Promise<void> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      return Promise.reject(new Error('Tenant not found'))
    }

    if (tenant.credits <= 0) {
      return Promise.reject(new Error('No credits'))
    }

    tenant.credits -= 1
    return Promise.resolve()
  }

  recordCreditEvent(input: CreditEventInput): Promise<void> {
    this.creditEvents.push(input)
    return Promise.resolve()
  }

  findCachedResult(input: {
    shopDomain: string
    productId: string
    userImageHash: string
  }): Promise<TryOnJob | null> {
    const [cached] = [...this.jobs.values()]
      .filter(
        (job) =>
          job.shop_domain === input.shopDomain &&
          job.product_id === input.productId &&
          job.user_image_hash === input.userImageHash &&
          job.status === 'completed' &&
          Boolean(job.result_url),
      )
      .toSorted(byCreatedAtDesc)

    return Promise.resolve(cached ?? null)
  }

  findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null> {
    const jobId = this.idempotency.get(`${tenantId}:${key}`)
    if (!jobId) {
      return Promise.resolve(null)
    }

    return Promise.resolve(this.jobs.get(jobId) ?? null)
  }

  saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void> {
    this.idempotency.set(`${tenantId}:${key}`, jobId)
    return Promise.resolve()
  }

  createJob(input: CreateJobInput): Promise<TryOnJob> {
    const now = new Date().toISOString()
    const job: TryOnJob = {
      created_at: now,
      credits_charged: 0,
      customer_id: input.customer_id ?? null,
      id: crypto.randomUUID(),
      model: input.model ?? 'advanced',
      product_id: input.product_id,
      provider_job_id: null,
      result_url: null,
      shop_domain: input.shop_domain,
      status: 'queued',
      updated_at: now,
      user_image_hash: input.userImageHash,
      visitor_id: input.visitor_id,
    }

    this.jobs.set(job.id, job)
    return Promise.resolve(job)
  }

  updateJobStatus(
    input: Parameters<DbGateway['updateJobStatus']>[0],
  ): ReturnType<DbGateway['updateJobStatus']> {
    const current = this.jobs.get(input.jobId)
    if (!current) {
      return Promise.reject(new Error('Job not found'))
    }

    const providerJobId = input.providerJobId ?? current.provider_job_id
    const shouldBeCharged = current.credits_charged > 0 || providerJobId !== null

    this.jobs.set(current.id, {
      ...current,
      credits_charged: shouldBeCharged ? 1 : 0,
      provider_job_id: providerJobId,
      result_url: input.resultUrl ?? current.result_url,
      status: input.status,
      updated_at: new Date().toISOString(),
    })

    return Promise.resolve()
  }

  getJob(jobId: string): Promise<TryOnJob | null> {
    return Promise.resolve(this.jobs.get(jobId) ?? null)
  }

  getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }> {
    const limit = query.limit ?? DEFAULT_HISTORY_LIMIT
    const offset = query.offset ?? 0

    const filteredJobs = [...this.jobs.values()]
      .filter((job) => job.shop_domain === query.shop_domain)
      .filter((job) => job.visitor_id === query.visitor_id)
      .filter((job) => (query.product_id ? job.product_id === query.product_id : true))
      .toSorted(byCreatedAtDesc)

    return Promise.resolve({
      items: filteredJobs.slice(offset, offset + limit),
      total: filteredJobs.length,
    })
  }
}

export function createInMemoryDbGateway(options?: InMemoryDbOptions): DbGateway {
  return new InMemoryDbGateway(options)
}

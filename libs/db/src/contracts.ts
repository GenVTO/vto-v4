import type { CreateTryOnRequest, TryOnHistoryQuery, TryOnJob, TryOnJobStatus } from '@vto/types'

export interface CreditEventInput {
  tenantId: string
  eventType: 'topup' | 'debit_tryon' | 'refund' | 'adjustment'
  amountCredits: number
  amountUsd?: string
  metadata?: Record<string, unknown>
}

export type CreateJobInput = CreateTryOnRequest & {
  tenantId: string
  userImageHash: string
}

export interface DbGateway {
  validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null>
  hasCredits(tenantId: string): Promise<boolean>
  reserveCredit(tenantId: string): Promise<void>
  recordCreditEvent(input: CreditEventInput): Promise<void>

  findCachedResult(input: {
    shopDomain: string
    productId: string
    userImageHash: string
  }): Promise<TryOnJob | null>

  findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null>
  saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void>

  createJob(input: CreateJobInput): Promise<TryOnJob>
  updateJobStatus(input: {
    jobId: string
    status: TryOnJobStatus
    providerJobId?: string
    resultUrl?: string
    errorCode?: string
    errorMessage?: string
  }): Promise<void>

  getJob(jobId: string): Promise<TryOnJob | null>
  getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }>
}

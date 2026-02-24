import type { CreateTryOnRequest, TryOnHistoryQuery, TryOnJob, TryOnJobStatus } from './try-on'

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

export interface CreditSnapshot {
  availableCredits: number
  completedConsumedCount: number
  failedChargedCount: number
  inFlightReservedCount: number
  refundedCredits: number
  reservedOrSpentCredits: number
}

export type TryOnJobEventType =
  | 'api_request_received'
  | 'input_images_uploaded'
  | 'provider_submit_started'
  | 'provider_submit_succeeded'
  | 'provider_submit_failed'
  | 'provider_poll_started'
  | 'provider_poll_completed'
  | 'provider_result_persist_started'
  | 'provider_result_persisted'
  | 'provider_result_persist_failed'
  | 'job_status_updated'
  | 'result_delivered_to_client'

export interface TryOnJobEventInput {
  tenantId: string
  jobId: string
  eventType: TryOnJobEventType
  metadata?: Record<string, unknown>
  occurredAt?: string
}

export interface DbGateway {
  validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null>
  hasCredits(tenantId: string): Promise<boolean>
  getCreditBalance(tenantId: string): Promise<number>
  getCreditSnapshot(tenantId: string): Promise<CreditSnapshot>
  listTenants(): Promise<{ tenantId: string; shopDomain: string }[]>
  reserveCreditForJob(tenantId: string, jobId: string): Promise<void>
  recordCreditEvent(input: CreditEventInput): Promise<void>

  findCachedResult(input: {
    shopDomain: string
    productId: string
    userImageHash: string
  }): Promise<TryOnJob | null>

  findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null>
  saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void>

  createJob(input: CreateJobInput): Promise<TryOnJob>
  recordJobEvent(input: TryOnJobEventInput): Promise<void>
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

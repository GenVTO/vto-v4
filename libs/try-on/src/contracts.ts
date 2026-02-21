import type { DbGateway } from '@vto/db/contracts'
import type {
  CreateTryOnRequest,
  CreateTryOnResponse,
  TryOnHistoryQuery,
  TryOnHistoryResponse,
  TryOnJob,
  TryOnModel,
} from '@vto/types'

export interface TryOnProviderSubmitPayload {
  model: TryOnModel
  productImageUrl: string
  personImageUrl: string
  params?: Record<string, unknown>
}

export interface TryOnProviderSubmitResult {
  providerJobId: string
  provider: string
  acceptedAt: string
}

export interface TryOnProviderStatusResult {
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'provider_expired'
  resultUrl?: string
  error?: string
}

export interface TryOnProvider {
  submit(payload: TryOnProviderSubmitPayload): Promise<TryOnProviderSubmitResult>
  status(providerJobId: string): Promise<TryOnProviderStatusResult>
}

export interface RunTryOnContext {
  tenantId: string
  shopDomain: string
}

export interface TryOnGateway {
  runTryOn(input: CreateTryOnRequest, context: RunTryOnContext): Promise<CreateTryOnResponse>
  getJobStatus(jobId: string, context: RunTryOnContext): Promise<TryOnJob | null>
  getHistory(query: TryOnHistoryQuery, context: RunTryOnContext): Promise<TryOnHistoryResponse>
  cancelJob(jobId: string): Promise<{ cancelled: boolean }>
}

export interface CreateTryOnGatewayOptions {
  db: DbGateway
  providers: Record<string, TryOnProvider>
  modelProviderMap: Record<TryOnModel, string>
}

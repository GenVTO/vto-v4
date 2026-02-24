import type {
  CreateTryOnRequest,
  CreateTryOnResponse,
  DbGateway,
  StorageGateway,
  TryOnHistoryQuery,
  TryOnHistoryResponse,
  TryOnJob,
  TryOnModel,
  TryOnProvider,
} from '@vto/types'

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
  storage: StorageGateway
  providers: Record<string, TryOnProvider>
  modelProviderMap?: Record<TryOnModel, string>
  modelProviderOrderMap?: Partial<Record<TryOnModel, string[]>>
}

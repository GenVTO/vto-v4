import type { TryOnModel } from './try-on'

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

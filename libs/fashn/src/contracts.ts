import type { TryOnProviderStatusResult } from '@vto/try-on/contracts'

export interface FashnClient {
  run(payload: {
    model: 'fashn-v1.6' | 'fashn-max'
    productImageUrl: string
    personImageUrl: string
    params?: Record<string, unknown>
  }): Promise<{ id: string }>
  status(jobId: string): Promise<TryOnProviderStatusResult>
}

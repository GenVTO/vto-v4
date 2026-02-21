import type {
  TryOnProvider,
  TryOnProviderStatusResult,
  TryOnProviderSubmitPayload,
  TryOnProviderSubmitResult,
} from '@vto/try-on/contracts'
import type { TryOnModel } from '@vto/types'

import type { FashnClient } from './contracts'

const modelMap: Record<TryOnModel, 'fashn-v1.6' | 'fashn-max'> = {
  advanced: 'fashn-max',
  normal: 'fashn-v1.6',
}

export class FashnTryOnProvider implements TryOnProvider {
  private readonly client: FashnClient

  constructor(client: FashnClient) {
    this.client = client
  }

  async submit(payload: TryOnProviderSubmitPayload): Promise<TryOnProviderSubmitResult> {
    const model = modelMap[payload.model]
    const job = await this.client.run({
      model,
      params: payload.params,
      personImageUrl: payload.personImageUrl,
      productImageUrl: payload.productImageUrl,
    })

    return {
      acceptedAt: new Date().toISOString(),
      provider: 'fashn',
      providerJobId: job.id,
    }
  }

  status(providerJobId: string): Promise<TryOnProviderStatusResult> {
    return this.client.status(providerJobId)
  }
}

export function toFashnModel(model: TryOnModel): 'fashn-v1.6' | 'fashn-max' {
  return modelMap[model]
}

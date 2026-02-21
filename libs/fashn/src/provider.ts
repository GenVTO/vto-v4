import type {
  TryOnProvider,
  TryOnProviderStatusResult,
  TryOnProviderSubmitPayload,
  TryOnProviderSubmitResult,
} from '@vto/try-on/contracts'

import { createLogger } from '@vto/logger'

import type { FashnClient } from './contracts'

import { toFashnModel } from './model'
const fashnLogger = createLogger({ service: '@vto/fashn-provider' })

export class FashnTryOnProvider implements TryOnProvider {
  private readonly client: FashnClient

  constructor(client: FashnClient) {
    this.client = client
  }

  async submit(payload: TryOnProviderSubmitPayload): Promise<TryOnProviderSubmitResult> {
    const model = toFashnModel(payload.model)
    fashnLogger.info('Submitting try-on to Fashn', {
      model,
    })
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
    fashnLogger.debug('Fetching Fashn status', {
      provider_job_id: providerJobId,
    })
    return this.client.status(providerJobId)
  }
}

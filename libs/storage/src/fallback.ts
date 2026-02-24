import type {
  PersistTryOnResultInput,
  PersistTryOnResultOutput,
  PutObjectInput,
  SignedUrlOptions,
  StorageGateway,
} from '@vto/types'

import { createLogger } from '@vto/logger'

import { toUint8Array } from './helpers'

const storageFallbackLogger = createLogger({ service: '@vto/storage-fallback' })

export interface NamedStorageGateway {
  gateway: StorageGateway
  name: string
}

export interface StorageGatewayChainOptions {
  order?: string[]
  providers: NamedStorageGateway[]
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export class FallbackStorageGateway implements StorageGateway {
  private readonly providers: NamedStorageGateway[]
  private readonly publicUrlOverride?: string

  constructor(providers: NamedStorageGateway[], publicUrlOverride?: string) {
    if (providers.length === 0) {
      throw new Error('FallbackStorageGateway requires at least one provider.')
    }
    this.providers = providers
    this.publicUrlOverride = publicUrlOverride
  }

  private async runWithFallback<T>(
    operation: string,
    runner: (provider: NamedStorageGateway) => Promise<T>,
  ): Promise<T> {
    const errors: Error[] = []

    for (const provider of this.providers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await runner(provider)
      } catch (error) {
        const failure = asError(error)
        errors.push(failure)
        storageFallbackLogger.warn('Storage provider failed, trying next', {
          error: failure.message,
          operation,
          provider: provider.name,
        })
      }
    }

    const message = `All storage providers failed for operation "${operation}".`
    throw new AggregateError(errors, message)
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    const retryableBody = await toUint8Array(input.body)

    return this.runWithFallback('put', ({ gateway }) =>
      gateway.put({
        ...input,
        body: retryableBody,
      }),
    )
  }

  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    return this.runWithFallback('getSignedUrl', ({ gateway }) => gateway.getSignedUrl(key, options))
  }

  async exists(key: string): Promise<boolean> {
    const errors: Error[] = []
    let successfulChecks = 0

    for (const provider of this.providers) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const exists = await provider.gateway.exists(key)
        successfulChecks += 1
        if (exists) {
          return true
        }
      } catch (error) {
        const failure = asError(error)
        errors.push(failure)
        storageFallbackLogger.warn('Storage provider failed during exists check', {
          error: failure.message,
          key,
          provider: provider.name,
        })
      }
    }

    if (successfulChecks > 0) {
      return false
    }

    throw new AggregateError(errors, `All storage providers failed for operation "exists".`)
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.runWithFallback('copy', ({ gateway }) => gateway.copy(sourceKey, destinationKey))
  }

  async delete(key: string): Promise<void> {
    await this.runWithFallback('delete', ({ gateway }) => gateway.delete(key))
  }

  async persistTryOnResult(input: PersistTryOnResultInput): Promise<PersistTryOnResultOutput> {
    const result = await this.runWithFallback('persistTryOnResult', ({ gateway }) =>
      gateway.persistTryOnResult(input),
    )

    if (this.publicUrlOverride) {
      // Replace origin (protocol + host + port) with the override URL
      try {
        const originalUrl = new URL(result.resultUrl)
        const overrideUrl = new URL(this.publicUrlOverride)

        // Keep the pathname and search params from the original URL
        // But use the protocol and host from the override URL
        originalUrl.protocol = overrideUrl.protocol
        originalUrl.host = overrideUrl.host
        originalUrl.port = overrideUrl.port

        // If override URL has a path prefix, we might want to handle that too,
        // But typically for tunnels/proxies we just want to replace the base.
        // Assuming override is just origin like https://s3-supa-dev.genvto.com

        return {
          ...result,
          resultUrl: originalUrl.toString(),
        }
      } catch (error) {
        storageFallbackLogger.warn('Failed to apply public URL override', {
          error: asError(error).message,
          original_url: result.resultUrl,
          override_url: this.publicUrlOverride,
        })
      }
    }

    return result
  }
}

export function createStorageGatewayChain(
  options: StorageGatewayChainOptions & { publicUrlOverride?: string },
): StorageGateway {
  const providersByName = new Map<string, NamedStorageGateway>()
  options.providers.forEach((provider) => {
    providersByName.set(provider.name, provider)
  })

  const selected: NamedStorageGateway[] = []
  const selectedNames = new Set<string>()

  const requestedOrder = options.order ?? []
  requestedOrder.forEach((name) => {
    const provider = providersByName.get(name)
    if (!provider) {
      storageFallbackLogger.warn('Storage provider in order is not configured, skipping', {
        provider: name,
      })
      return
    }
    if (!selectedNames.has(name)) {
      selected.push(provider)
      selectedNames.add(name)
    }
  })

  options.providers.forEach((provider) => {
    if (!selectedNames.has(provider.name)) {
      selected.push(provider)
      selectedNames.add(provider.name)
    }
  })

  if (selected.length === 0) {
    throw new Error('No storage providers available to create storage gateway chain.')
  }

  return new FallbackStorageGateway(selected, options.publicUrlOverride)
}

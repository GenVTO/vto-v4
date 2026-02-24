import type { R2LikeBucket } from '@vto/r2-storage'
import type { StorageGateway } from '@vto/types'

import { collectEnv, parseStorageEnv } from '@vto/env'
import { createLogger } from '@vto/logger'
import { R2StorageGateway } from '@vto/r2-storage'
import { createS3StorageGateway } from '@vto/s3-storage'

import { createStorageGatewayChain } from './fallback'
import { createInDiskStorageGateway } from './in-disk'

const storageLogger = createLogger({ service: '@vto/storage-gateway' })

export interface StorageGatewayFactoryOptions {
  bindings?: Record<string, unknown>
  env?: Record<string, string | undefined>
}

function isR2LikeBucket(value: unknown): value is R2LikeBucket {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.put === 'function' &&
    typeof candidate.head === 'function' &&
    typeof candidate.get === 'function' &&
    typeof candidate.delete === 'function'
  )
}

function resolveR2Bucket(
  bindingName: string,
  bindings: Record<string, unknown> | undefined,
): R2LikeBucket | null {
  if (bindings) {
    const candidate = bindings[bindingName]
    if (isR2LikeBucket(candidate)) {
      return candidate
    }
  }

  const globalCandidate = (globalThis as Record<string, unknown>)[bindingName]
  return isR2LikeBucket(globalCandidate) ? globalCandidate : null
}

function mapOrder(order: string[]): string[] {
  return order.flatMap((entry) => {
    if (entry === 's3') {
      return ['s3:default']
    }
    if (entry === 'r2') {
      return ['r2:default']
    }
    return [entry]
  })
}

export function createStorageGateway(options: StorageGatewayFactoryOptions = {}): StorageGateway {
  const env = collectEnv({ source: options.env })
  const configuredStorage = parseStorageEnv(env)

  const providers: { gateway: StorageGateway; name: string }[] = []

  for (const r2Config of configuredStorage.R2_CONFIGS) {
    const bucket = resolveR2Bucket(r2Config.binding, options.bindings)
    if (bucket) {
      providers.push({
        gateway: new R2StorageGateway(bucket, {
          publicBaseUrl: r2Config.publicBaseUrl,
        }),
        name: `r2:${r2Config.name}`,
      })
    } else {
      storageLogger.warn('R2 configured but binding is not available, skipping provider', {
        binding: r2Config.binding,
        bucket: r2Config.bucketName ?? null,
        name: r2Config.name,
      })
    }
  }

  for (const s3Config of configuredStorage.S3_CONFIGS) {
    providers.push({
      gateway: createS3StorageGateway({
        bucket: s3Config.bucket,
        credentials: {
          accessKeyId: s3Config.accessKeyId,
          secretAccessKey: s3Config.secretAccessKey,
          sessionToken: s3Config.sessionToken,
        },
        endpoint: s3Config.endpoint,
        forcePathStyle: s3Config.forcePathStyle,
        publicBaseUrl: s3Config.publicBaseUrl,
        region: s3Config.region,
      }),
      name: `s3:${s3Config.name}`,
    })
  }

  providers.push({
    gateway: createInDiskStorageGateway(),
    name: 'disk',
  })

  const order = mapOrder(configuredStorage.STORAGE_PROVIDER_ORDER)
  storageLogger.info('Initialized storage gateway chain', {
    configured_order: order,
    providers: providers.map((provider) => provider.name),
  })

  return createStorageGatewayChain({
    order,
    providers,
    publicUrlOverride: configuredStorage.STORAGE_PUBLIC_URL_OVERRIDE,
  })
}

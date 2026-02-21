import type { DbGateway } from '@vto/db/contracts'
import type { R2LikeBucket } from '@vto/r2-storage'
import type { StorageGateway } from '@vto/storage/contracts'

import { createClient } from '@supabase/supabase-js'
import { createInMemoryDbGateway } from '@vto/db'
import { collectEnv, commonAliases, parseR2Env, parseSupabaseEnv, resolveEnvValue } from '@vto/env'
import { createFashnClientFromEnv, FashnTryOnProvider, MockFashnClient } from '@vto/fashn'
import { createLogger } from '@vto/logger'
import { R2StorageGateway } from '@vto/r2-storage'
import { createInDiskStorageGateway } from '@vto/storage'
import { createSupabaseDbGateway } from '@vto/supabase-db'
import { createTryOnGateway } from '@vto/try-on'

const defaultApiKey = 'dev_vto_api_key'
const defaultShopDomain = 'demo-shop.myshopify.com'
const runtimeLogger = createLogger({ service: '@vto/web-runtime' })

const env = collectEnv()

function getEnvValue(key: string): string | undefined {
  return resolveEnvValue(env, key, {
    aliases: commonAliases(key),
  })
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

function resolveR2BucketFromGlobal(bindingName: string): R2LikeBucket | null {
  const candidate = (globalThis as Record<string, unknown>)[bindingName]
  return isR2LikeBucket(candidate) ? candidate : null
}

function parseConfiguredR2(): {
  bindingName: string
  bucketName: string
  publicBaseUrl?: string
} | null {
  if (!getEnvValue('R2_BUCKET_NAME')) {
    return null
  }

  const parsed = parseR2Env(env)
  return {
    bindingName: parsed.R2_BUCKET_BINDING,
    bucketName: parsed.R2_BUCKET_NAME,
    publicBaseUrl: parsed.R2_PUBLIC_BASE_URL,
  }
}

function createDbGateway(): DbGateway {
  const hasSupabase =
    Boolean(getEnvValue('SUPABASE_URL')) && Boolean(getEnvValue('SUPABASE_SERVICE_ROLE_KEY'))

  if (hasSupabase) {
    const parsed = parseSupabaseEnv(env)
    const client = createClient(parsed.SUPABASE_URL, parsed.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    runtimeLogger.info('Initialized supabase db gateway')
    return createSupabaseDbGateway(client)
  }

  runtimeLogger.info('Initialized in-memory db gateway', {
    seeded_tenants: 1,
  })
  return createInMemoryDbGateway({
    seedTenants: [
      {
        apiKey: defaultApiKey,
        credits: 1000,
        shopDomain: defaultShopDomain,
        tenantId: 'tenant_demo',
      },
    ],
  })
}

const configuredR2 = parseConfiguredR2()

function createStorageGateway(config: typeof configuredR2): StorageGateway {
  if (config) {
    const bucket = resolveR2BucketFromGlobal(config.bindingName)
    if (bucket) {
      runtimeLogger.info('Initialized R2 storage gateway', {
        binding: config.bindingName,
        bucket: config.bucketName,
      })
      return new R2StorageGateway(bucket, {
        publicBaseUrl: config.publicBaseUrl,
      })
    }

    runtimeLogger.warn('R2 configured but binding is not available, using in-disk storage', {
      binding: config.bindingName,
      bucket: config.bucketName,
    })
  }

  runtimeLogger.info('Initialized in-disk storage gateway')
  return createInDiskStorageGateway()
}

const db = createDbGateway()
let storage = createStorageGateway(configuredR2)

const hasFashnApiKey = Boolean(getEnvValue('FASHN_API_KEY'))

const fashnClient = hasFashnApiKey
  ? createFashnClientFromEnv({ env })
  : new MockFashnClient({
      failRate: 0.15,
      maxDelayMs: 12_000,
      minDelayMs: 4000,
    })

const fashnProvider = new FashnTryOnProvider(fashnClient)
runtimeLogger.info('Initialized Fashn try-on provider', {
  mode: hasFashnApiKey ? 'api' : 'mock',
})

const tryOnGateway = createTryOnGateway({
  db,
  modelProviderMap: {
    advanced: 'fashn',
    normal: 'fashn',
  },
  providers: {
    fashn: fashnProvider,
  },
})
runtimeLogger.info('Initialized try-on gateway', {
  models: ['normal', 'advanced'],
  providers: ['fashn'],
})

export const runtime = {
  db,
  defaults: {
    apiKey: defaultApiKey,
    shopDomain: defaultShopDomain,
  },
  logger: runtimeLogger,
  storage,
  tryOnGateway,
}

export function configureRuntimeBindings(bindings: Record<string, unknown> | undefined): void {
  if (!configuredR2 || !bindings || runtime.storage instanceof R2StorageGateway) {
    return
  }

  const candidate = bindings[configuredR2.bindingName]
  if (!isR2LikeBucket(candidate)) {
    return
  }

  storage = new R2StorageGateway(candidate, {
    publicBaseUrl: configuredR2.publicBaseUrl,
  })
  runtime.storage = storage
  runtimeLogger.info('Bound R2 storage gateway from Cloudflare runtime bindings', {
    binding: configuredR2.bindingName,
    bucket: configuredR2.bucketName,
  })
}

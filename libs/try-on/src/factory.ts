import type { DbGateway, StorageGateway, TryOnProvider } from '@vto/types'

import { collectEnv, commonAliases, resolveEnvValue } from '@vto/env'
import { createFashnClientFromEnv, FashnTryOnProvider, MockFashnClient } from '@vto/fashn'
import { createLogger } from '@vto/logger'

import type { CreateTryOnGatewayOptions, TryOnGateway } from './contracts'

import { createTryOnGateway } from './gateway'

const tryOnFactoryLogger = createLogger({ service: '@vto/try-on-factory' })

export interface CreateTryOnGatewayFromEnvOptions {
  db: DbGateway
  storage: StorageGateway
  env?: Record<string, string | undefined>
}

function parseProviderOrder(raw: string | undefined): string[] {
  if (!raw) {
    return ['fashn']
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function hasEnvValue(env: Record<string, string | undefined>, key: string): boolean {
  const value = resolveEnvValue(env, key, {
    aliases: commonAliases(key),
  })
  return Boolean(value && value.trim().length > 0)
}

function buildProviders(env: Record<string, string | undefined>): Record<string, TryOnProvider> {
  const providers: Record<string, TryOnProvider> = {}
  const hasFashnApiKey = hasEnvValue(env, 'FASHN_API_KEY')

  const fashnClient = hasFashnApiKey
    ? createFashnClientFromEnv({ env })
    : new MockFashnClient({
        failRate: 0.15,
        maxDelayMs: 12_000,
        minDelayMs: 4000,
      })

  providers.fashn = new FashnTryOnProvider(fashnClient)
  tryOnFactoryLogger.info('Configured try-on provider', {
    mode: hasFashnApiKey ? 'api' : 'mock',
    provider: 'fashn',
  })

  return providers
}

export function createTryOnGatewayFromEnv(options: CreateTryOnGatewayFromEnvOptions): TryOnGateway {
  const env = collectEnv({ source: options.env })
  const providers = buildProviders(env)
  const providerOrder = parseProviderOrder(
    resolveEnvValue(env, 'TRYON_PROVIDER_ORDER', {
      aliases: commonAliases('TRYON_PROVIDER_ORDER'),
    }),
  )

  const gatewayOptions: CreateTryOnGatewayOptions = {
    db: options.db,
    modelProviderOrderMap: {
      advanced: providerOrder,
      normal: providerOrder,
    },
    providers,
    storage: options.storage,
  }
  return createTryOnGateway(gatewayOptions)
}

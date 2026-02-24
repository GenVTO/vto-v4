import type { DbGateway } from '@vto/types'

import { createClient } from '@supabase/supabase-js'
import {
  collectEnv,
  commonAliases,
  parseSqliteEnv,
  parseSupabaseEnv,
  resolveEnvValue,
} from '@vto/env'
import { createLogger } from '@vto/logger'
import { createSqliteDbGateway } from '@vto/sqlite-db'
import { createSupabaseDbGateway } from '@vto/supabase-db'

import type { InMemoryTenant } from './in-memory'

import { createInMemoryDbGateway } from './in-memory'

const dbLogger = createLogger({ service: '@vto/db-gateway' })

export interface DbGatewayFactoryOptions {
  env?: Record<string, string | undefined>
  seedTenants?: InMemoryTenant[]
  sqliteMigrationDir?: string
}

const DEFAULT_SEED_TENANTS: InMemoryTenant[] = [
  {
    apiKey: 'local_dev_api_key',
    credits: 1000,
    shopDomain: 'local-dev.myshopify.com',
    tenantId: 'tenant_local_dev',
  },
]

export function createDbGateway(options: DbGatewayFactoryOptions = {}): DbGateway {
  const env = collectEnv({ source: options.env })
  const seedTenants = options.seedTenants ?? DEFAULT_SEED_TENANTS

  const sqliteDbUrl = resolveEnvValue(env, 'SQLITE_DB_URL', {
    aliases: commonAliases('SQLITE_DB_URL'),
  })
  const useSqliteInTests = !sqliteDbUrl && env.NODE_ENV === 'test'
  if (sqliteDbUrl || useSqliteInTests) {
    const sqliteEnv = sqliteDbUrl
      ? parseSqliteEnv(env)
      : { SQLITE_AUTH_TOKEN: undefined, SQLITE_DB_URL: 'file:.tmp/vto-tests.sqlite' }
    dbLogger.info('Initialized sqlite db gateway', {
      seeded_tenants: seedTenants.length,
      sqlite_url: sqliteEnv.SQLITE_DB_URL,
    })
    return createSqliteDbGateway({
      authToken: sqliteEnv.SQLITE_AUTH_TOKEN,
      migrationDir: options.sqliteMigrationDir,
      seedTenants: seedTenants.map((tenant) => ({
        apiKey: tenant.apiKey,
        credits: tenant.credits,
        shopDomain: tenant.shopDomain,
        tenantId: tenant.tenantId,
      })),
      url: sqliteEnv.SQLITE_DB_URL,
    })
  }

  const supabaseUrl = resolveEnvValue(env, 'SUPABASE_URL', {
    aliases: commonAliases('SUPABASE_URL'),
  })
  const supabaseServiceRoleKey = resolveEnvValue(env, 'SUPABASE_SERVICE_ROLE_KEY', {
    aliases: commonAliases('SUPABASE_SERVICE_ROLE_KEY'),
  })

  const hasSupabase = Boolean(supabaseUrl) && Boolean(supabaseServiceRoleKey)
  if (hasSupabase) {
    const parsed = parseSupabaseEnv(env)
    const client = createClient(parsed.SUPABASE_URL, parsed.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    dbLogger.info('Initialized supabase db gateway')
    return createSupabaseDbGateway(client)
  }

  dbLogger.info('Initialized in-memory db gateway', {
    seeded_tenants: seedTenants.length,
  })
  return createInMemoryDbGateway({ seedTenants })
}

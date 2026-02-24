import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

export const sqliteEnvSchema = z.object({
  SQLITE_AUTH_TOKEN: z.string().optional(),
  SQLITE_DB_URL: z.string().min(1),
})

export type SqliteEnv = z.infer<typeof sqliteEnvSchema>

export function parseSqliteEnv(source?: EnvSource): SqliteEnv {
  const env = collectEnv({ source })

  return parseWithSchema(sqliteEnvSchema, {
    SQLITE_AUTH_TOKEN: resolveEnvValue(env, 'SQLITE_AUTH_TOKEN', {
      aliases: commonAliases('SQLITE_AUTH_TOKEN'),
    }),
    SQLITE_DB_URL: resolveEnvValue(env, 'SQLITE_DB_URL', {
      aliases: commonAliases('SQLITE_DB_URL'),
    }),
  })
}

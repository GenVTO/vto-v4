import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

const DEFAULT_RATE_LIMIT_BURST = 20
const DEFAULT_RATE_LIMIT_PER_MINUTE = 60
const DEFAULT_RESULT_TTL_DAYS = 15

export const serverEnvSchema = z.object({
  API_RATE_LIMIT_BURST: z.coerce.number().int().min(1).default(DEFAULT_RATE_LIMIT_BURST),
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(DEFAULT_RATE_LIMIT_PER_MINUTE),
  DEFAULT_RESULT_TTL_DAYS: z.coerce.number().int().min(1).default(DEFAULT_RESULT_TTL_DAYS),
  MAX_IMAGE_MB: z.coerce.number().int().min(1).default(5),
  MAX_REQUEST_MB: z.coerce.number().int().min(1).default(8),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(source?: EnvSource): ServerEnv {
  const env = collectEnv({ source })

  return parseWithSchema(serverEnvSchema, {
    API_RATE_LIMIT_BURST: resolveEnvValue(env, 'API_RATE_LIMIT_BURST', {
      aliases: commonAliases('API_RATE_LIMIT_BURST'),
    }),
    API_RATE_LIMIT_PER_MINUTE: resolveEnvValue(env, 'API_RATE_LIMIT_PER_MINUTE', {
      aliases: commonAliases('API_RATE_LIMIT_PER_MINUTE'),
    }),
    DEFAULT_RESULT_TTL_DAYS: resolveEnvValue(env, 'DEFAULT_RESULT_TTL_DAYS', {
      aliases: commonAliases('DEFAULT_RESULT_TTL_DAYS'),
    }),
    MAX_IMAGE_MB: resolveEnvValue(env, 'MAX_IMAGE_MB', {
      aliases: commonAliases('MAX_IMAGE_MB'),
    }),
    MAX_REQUEST_MB: resolveEnvValue(env, 'MAX_REQUEST_MB', {
      aliases: commonAliases('MAX_REQUEST_MB'),
    }),
    NODE_ENV: resolveEnvValue(env, 'NODE_ENV', {
      aliases: commonAliases('NODE_ENV'),
    }),
  })
}

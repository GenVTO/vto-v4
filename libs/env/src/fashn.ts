import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

const MIN_FASHN_TIMEOUT_MS = 1000
const DEFAULT_FASHN_TIMEOUT_MS = 120_000

export const fashnEnvSchema = z.object({
  FASHN_API_KEY: z.string().min(1),
  FASHN_BASE_URL: z.url().default('https://api.fashn.ai'),
  FASHN_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(MIN_FASHN_TIMEOUT_MS)
    .default(DEFAULT_FASHN_TIMEOUT_MS),
})

export type FashnEnv = z.infer<typeof fashnEnvSchema>

export function parseFashnEnv(source?: EnvSource): FashnEnv {
  const env = collectEnv({ source })

  return parseWithSchema(fashnEnvSchema, {
    FASHN_API_KEY: resolveEnvValue(env, 'FASHN_API_KEY', {
      aliases: commonAliases('FASHN_API_KEY'),
    }),
    FASHN_BASE_URL: resolveEnvValue(env, 'FASHN_BASE_URL', {
      aliases: commonAliases('FASHN_BASE_URL'),
    }),
    FASHN_TIMEOUT_MS: resolveEnvValue(env, 'FASHN_TIMEOUT_MS', {
      aliases: commonAliases('FASHN_TIMEOUT_MS'),
    }),
  })
}

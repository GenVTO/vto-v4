import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

function normalizeOptionalString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const r2EnvSchema = z
  .object({
    R2_BUCKET_BINDING: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_BASE_URL: z.url().optional(),
  })
  .transform((parsed) => ({
    ...parsed,
    R2_BUCKET_BINDING: parsed.R2_BUCKET_BINDING ?? parsed.R2_BUCKET_NAME,
  }))

export type R2Env = z.infer<typeof r2EnvSchema>

export function parseR2Env(source?: EnvSource): R2Env {
  const env = collectEnv({ source })

  return parseWithSchema(r2EnvSchema, {
    R2_BUCKET_BINDING: normalizeOptionalString(
      resolveEnvValue(env, 'R2_BUCKET_BINDING', {
        aliases: commonAliases('R2_BUCKET_BINDING'),
      }),
    ),
    R2_BUCKET_NAME: resolveEnvValue(env, 'R2_BUCKET_NAME', {
      aliases: commonAliases('R2_BUCKET_NAME'),
    }),
    R2_PUBLIC_BASE_URL: normalizeOptionalString(
      resolveEnvValue(env, 'R2_PUBLIC_BASE_URL', {
        aliases: commonAliases('R2_PUBLIC_BASE_URL'),
      }),
    ),
  })
}

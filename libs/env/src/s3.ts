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

function parseForcePathStyle(value: string | undefined): boolean {
  if (!value) {
    return true
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') {
    return true
  }
  if (normalized === 'false' || normalized === '0') {
    return false
  }
  return true
}

export const s3EnvSchema = z.object({
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ENDPOINT: z.url(),
  S3_FORCE_PATH_STYLE: z.boolean().default(true),
  S3_PUBLIC_BASE_URL: z.url().optional(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_SESSION_TOKEN: z.string().min(1).optional(),
  // oxlint-disable-next-line no-magic-numbers
  TRYON_RESULT_TTL_DAYS: z.coerce.number().min(1).max(365).optional(),
})

export type S3Env = z.infer<typeof s3EnvSchema>

export function parseS3Env(source?: EnvSource): S3Env {
  const env = collectEnv({ source })

  return parseWithSchema(s3EnvSchema, {
    S3_ACCESS_KEY_ID: resolveEnvValue(env, 'S3_ACCESS_KEY_ID', {
      aliases: commonAliases('S3_ACCESS_KEY_ID'),
    }),
    S3_BUCKET: resolveEnvValue(env, 'S3_BUCKET', {
      aliases: commonAliases('S3_BUCKET'),
    }),
    S3_ENDPOINT: resolveEnvValue(env, 'S3_ENDPOINT', {
      aliases: commonAliases('S3_ENDPOINT'),
    }),
    S3_FORCE_PATH_STYLE: parseForcePathStyle(
      normalizeOptionalString(
        resolveEnvValue(env, 'S3_FORCE_PATH_STYLE', {
          aliases: commonAliases('S3_FORCE_PATH_STYLE'),
        }),
      ),
    ),
    S3_PUBLIC_BASE_URL: normalizeOptionalString(
      resolveEnvValue(env, 'S3_PUBLIC_BASE_URL', {
        aliases: commonAliases('S3_PUBLIC_BASE_URL'),
      }),
    ),
    S3_REGION: normalizeOptionalString(
      resolveEnvValue(env, 'S3_REGION', {
        aliases: commonAliases('S3_REGION'),
      }),
    ),
    S3_SECRET_ACCESS_KEY: resolveEnvValue(env, 'S3_SECRET_ACCESS_KEY', {
      aliases: commonAliases('S3_SECRET_ACCESS_KEY'),
    }),
    S3_SESSION_TOKEN: normalizeOptionalString(
      resolveEnvValue(env, 'S3_SESSION_TOKEN', {
        aliases: commonAliases('S3_SESSION_TOKEN'),
      }),
    ),
    TRYON_RESULT_TTL_DAYS: normalizeOptionalString(
      resolveEnvValue(env, 'TRYON_RESULT_TTL_DAYS', {
        aliases: commonAliases('TRYON_RESULT_TTL_DAYS'),
      }),
    ),
  })
}

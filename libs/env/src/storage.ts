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

function parseOrder(value: string | undefined): string[] {
  if (!value) {
    return ['r2:default', 's3:default', 'disk']
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

const s3ConfigSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  forcePathStyle: z.boolean().default(true),
  name: z.string().min(1),
  publicBaseUrl: z.url().optional(),
  region: z.string().min(1).default('us-east-1'),
  secretAccessKey: z.string().min(1),
  sessionToken: z.string().min(1).optional(),
})

export type StorageS3Config = z.infer<typeof s3ConfigSchema>

const r2ConfigSchema = z.object({
  binding: z.string().min(1),
  bucketName: z.string().min(1).optional(),
  name: z.string().min(1),
  publicBaseUrl: z.url().optional(),
})

export type StorageR2Config = z.infer<typeof r2ConfigSchema>

export const storageEnvSchema = z.object({
  R2_CONFIGS: z.array(r2ConfigSchema).default([]),
  S3_CONFIGS: z.array(s3ConfigSchema).default([]),
  STORAGE_PROVIDER_ORDER: z.array(z.string().min(1)).default(['r2:default', 's3:default', 'disk']),
  STORAGE_PUBLIC_URL_OVERRIDE: z.url().optional(),
})

export type StorageEnv = z.infer<typeof storageEnvSchema>

function parseS3ConfigsJson(raw: string | undefined): StorageS3Config[] {
  if (!raw) {
    return []
  }

  const parsed = JSON.parse(raw) as unknown
  const objectSchema = z.object({
    accessKeyId: z.string().min(1),
    bucket: z.string().min(1),
    endpoint: z.url(),
    forcePathStyle: z.boolean().optional(),
    name: z.string().min(1),
    publicBaseUrl: z.url().optional(),
    region: z.string().min(1).optional(),
    secretAccessKey: z.string().min(1),
    sessionToken: z.string().min(1).optional(),
  })

  return z
    .array(objectSchema)
    .parse(parsed)
    .map((config) => ({
      accessKeyId: config.accessKeyId,
      bucket: config.bucket,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? true,
      name: config.name,
      publicBaseUrl: config.publicBaseUrl,
      region: config.region ?? 'us-east-1',
      secretAccessKey: config.secretAccessKey,
      sessionToken: config.sessionToken,
    }))
}

function parseR2ConfigsJson(raw: string | undefined): StorageR2Config[] {
  if (!raw) {
    return []
  }

  const parsed = JSON.parse(raw) as unknown
  const objectSchema = z.object({
    binding: z.string().min(1),
    bucketName: z.string().min(1).optional(),
    name: z.string().min(1),
    publicBaseUrl: z.url().optional(),
  })

  return z
    .array(objectSchema)
    .parse(parsed)
    .map((config) => ({
      binding: config.binding,
      bucketName: config.bucketName,
      name: config.name,
      publicBaseUrl: config.publicBaseUrl,
    }))
}

function assertUniqueConfigNames(configs: { name: string }[], provider: 'r2' | 's3'): void {
  const seen = new Set<string>()
  for (const config of configs) {
    if (seen.has(config.name)) {
      throw new Error(
        `Duplicate ${provider.toUpperCase()} config name "${config.name}" in storage configuration.`,
      )
    }
    seen.add(config.name)
  }
}

export function parseStorageEnv(source?: EnvSource): StorageEnv {
  const env = collectEnv({ source })

  const resolved = {
    R2_CONFIGS_JSON: resolveEnvValue(env, 'R2_CONFIGS_JSON', {
      aliases: commonAliases('R2_CONFIGS_JSON'),
    }),
    S3_CONFIGS_JSON: resolveEnvValue(env, 'S3_CONFIGS_JSON', {
      aliases: commonAliases('S3_CONFIGS_JSON'),
    }),
    STORAGE_PROVIDER_ORDER: resolveEnvValue(env, 'STORAGE_PROVIDER_ORDER', {
      aliases: commonAliases('STORAGE_PROVIDER_ORDER'),
    }),
    STORAGE_PUBLIC_URL_OVERRIDE: resolveEnvValue(env, 'STORAGE_PUBLIC_URL_OVERRIDE', {
      aliases: commonAliases('STORAGE_PUBLIC_URL_OVERRIDE'),
    }),
  }

  const r2JsonConfigs = parseR2ConfigsJson(normalizeOptionalString(resolved.R2_CONFIGS_JSON))
  const s3JsonConfigs = parseS3ConfigsJson(normalizeOptionalString(resolved.S3_CONFIGS_JSON))
  assertUniqueConfigNames(r2JsonConfigs, 'r2')
  assertUniqueConfigNames(s3JsonConfigs, 's3')

  return parseWithSchema(storageEnvSchema, {
    R2_CONFIGS: r2JsonConfigs,
    S3_CONFIGS: s3JsonConfigs,
    STORAGE_PROVIDER_ORDER: parseOrder(normalizeOptionalString(resolved.STORAGE_PROVIDER_ORDER)),
    STORAGE_PUBLIC_URL_OVERRIDE: normalizeOptionalString(resolved.STORAGE_PUBLIC_URL_OVERRIDE),
  })
}

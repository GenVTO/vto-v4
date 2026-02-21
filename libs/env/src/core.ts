import type { z } from 'zod'

export type EnvValue = string | undefined
export type EnvRecord = Record<string, EnvValue>
export type EnvSource = EnvRecord | undefined

export interface ResolveEnvValueOptions {
  aliases?: string[]
}

export interface CollectEnvOptions {
  source?: EnvSource
  includeProcessEnv?: boolean
  includeImportMetaEnv?: boolean
  includeGlobalEnv?: boolean
}

declare global {
  interface GlobalThis {
    __ENV__?: EnvRecord
  }
}

function normalizeEnvValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return undefined
  }
  return String(value)
}

function fromProcessEnv(): EnvRecord {
  const processEnv = (globalThis as { process?: { env?: Record<string, unknown> } }).process?.env
  if (!processEnv) {
    return {}
  }

  const result: EnvRecord = {}
  for (const [key, value] of Object.entries(processEnv)) {
    result[key] = normalizeEnvValue(value)
  }
  return result
}

function fromImportMetaEnv(): EnvRecord {
  const { env } = import.meta as { env?: Record<string, unknown> }
  if (!env) {
    return {}
  }

  const result: EnvRecord = {}
  for (const [key, value] of Object.entries(env)) {
    result[key] = normalizeEnvValue(value)
  }
  return result
}

function fromGlobalEnv(): EnvRecord {
  if (typeof globalThis === 'undefined') {
    return {}
  }
  const env = (globalThis as { __ENV__?: EnvRecord }).__ENV__
  return env ? { ...env } : {}
}

export function collectEnv(options: CollectEnvOptions = {}): EnvRecord {
  const {
    source,
    includeProcessEnv = true,
    includeImportMetaEnv = true,
    includeGlobalEnv = true,
  } = options

  if (source) {
    return { ...source }
  }

  return {
    ...(includeGlobalEnv ? fromGlobalEnv() : {}),
    ...(includeProcessEnv ? fromProcessEnv() : {}),
    ...(includeImportMetaEnv ? fromImportMetaEnv() : {}),
  }
}

export function resolveEnvValue(
  env: EnvRecord,
  key: string,
  options: ResolveEnvValueOptions = {},
): EnvValue {
  const aliases = options.aliases ?? []

  if (key in env) {
    return env[key]
  }
  for (const alias of aliases) {
    if (alias in env) {
      return env[alias]
    }
  }

  return undefined
}

export function commonAliases(key: string): string[] {
  return [`VITE_${key}`, `PUBLIC_${key}`]
}

export function parseWithSchema<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  values: Record<string, unknown>,
): z.infer<TSchema> {
  return schema.parse(values)
}

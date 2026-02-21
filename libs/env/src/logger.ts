import { z } from 'zod'

import type { EnvSource } from './core'

import { collectEnv, commonAliases, parseWithSchema, resolveEnvValue } from './core'

const LOGGER_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const
const RUNTIME_MODES = ['development', 'test', 'production'] as const
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off'])

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback
  }

  const normalized = value.toLowerCase()
  if (TRUE_VALUES.has(normalized)) {
    return true
  }
  if (FALSE_VALUES.has(normalized)) {
    return false
  }

  return fallback
}

export const loggerEnvSchema = z.object({
  AXIOM_DATASET: z.string().min(1).optional(),
  AXIOM_TOKEN: z.string().min(1).optional(),
  LOG_ENABLE_AXIOM: z.boolean(),
  LOG_ENABLE_PINO: z.boolean(),
  LOG_ENABLE_SENTRY: z.boolean(),
  LOG_LEVEL: z.enum(LOGGER_LEVELS).optional(),
  NODE_ENV: z.enum(RUNTIME_MODES).default('development'),
  SENTRY_DSN: z.string().min(1).optional(),
})

export type LoggerEnv = z.infer<typeof loggerEnvSchema>
export type LoggerEnvMode = LoggerEnv['NODE_ENV']
export type LoggerEnvLevel = NonNullable<LoggerEnv['LOG_LEVEL']>

export function parseLoggerEnv(source?: EnvSource): LoggerEnv {
  const env = collectEnv({ source })
  const nodeEnv =
    resolveEnvValue(env, 'NODE_ENV', { aliases: commonAliases('NODE_ENV') }) ??
    resolveEnvValue(env, 'MODE', { aliases: commonAliases('MODE') }) ??
    'development'

  const isProduction = nodeEnv === 'production'

  return parseWithSchema(loggerEnvSchema, {
    AXIOM_DATASET: resolveEnvValue(env, 'AXIOM_DATASET', {
      aliases: commonAliases('AXIOM_DATASET'),
    }),
    AXIOM_TOKEN: resolveEnvValue(env, 'AXIOM_TOKEN', {
      aliases: commonAliases('AXIOM_TOKEN'),
    }),
    LOG_ENABLE_AXIOM: parseBoolean(
      resolveEnvValue(env, 'LOG_ENABLE_AXIOM', {
        aliases: commonAliases('LOG_ENABLE_AXIOM'),
      }),
      isProduction,
    ),
    LOG_ENABLE_PINO: parseBoolean(
      resolveEnvValue(env, 'LOG_ENABLE_PINO', {
        aliases: commonAliases('LOG_ENABLE_PINO'),
      }),
      true,
    ),
    LOG_ENABLE_SENTRY: parseBoolean(
      resolveEnvValue(env, 'LOG_ENABLE_SENTRY', {
        aliases: commonAliases('LOG_ENABLE_SENTRY'),
      }),
      isProduction,
    ),
    LOG_LEVEL: resolveEnvValue(env, 'LOG_LEVEL', {
      aliases: commonAliases('LOG_LEVEL'),
    }),
    NODE_ENV: nodeEnv,
    SENTRY_DSN: resolveEnvValue(env, 'SENTRY_DSN', {
      aliases: commonAliases('SENTRY_DSN'),
    }),
  })
}

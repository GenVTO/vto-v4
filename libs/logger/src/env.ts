import type { LoggerEnvMode } from '@vto/env/logger'

import { parseLoggerEnv } from '@vto/env/logger'

export type RuntimeMode = LoggerEnvMode

export interface LoggerEnvConfig {
  axiomDataset?: string
  axiomToken?: string
  enableAxiom: boolean
  enablePino: boolean
  enableSentry: boolean
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  mode: RuntimeMode
  sentryDsn?: string
}

export function detectRuntimeMode(): RuntimeMode {
  return parseLoggerEnv().NODE_ENV
}

export function detectLoggerEnvConfig(): LoggerEnvConfig {
  const env = parseLoggerEnv()
  const mode = env.NODE_ENV

  return {
    axiomDataset: env.AXIOM_DATASET,
    axiomToken: env.AXIOM_TOKEN,
    enableAxiom: env.LOG_ENABLE_AXIOM && Boolean(env.AXIOM_TOKEN && env.AXIOM_DATASET),
    enablePino: env.LOG_ENABLE_PINO,
    enableSentry: env.LOG_ENABLE_SENTRY && Boolean(env.SENTRY_DSN),
    level: env.LOG_LEVEL,
    mode,
    sentryDsn: env.SENTRY_DSN,
  }
}

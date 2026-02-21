import type { RuntimeMode } from './env'
import type { LogContext, LogEvent, LogLevel, LogTransport } from './transports/types'

import { detectLoggerEnvConfig } from './env'
import { createAxiomTransport } from './transports/axiom'
import { createPinoTransport } from './transports/pino'
import { createSentryTransport } from './transports/sentry'

export type { LogContext, LogLevel }

export interface LoggerOptions {
  service?: string
  mode?: RuntimeMode
  baseContext?: LogContext
  minLevel?: LogLevel
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  fatal(message: string, context?: LogContext): void
  child(context: LogContext): Logger
}

const LEVEL_VALUE: Record<LogLevel, number> = {
  debug: 10,
  error: 40,
  fatal: 50,
  info: 20,
  warn: 30,
}

function resolveMinLevel(mode: RuntimeMode, minLevel?: LogLevel): LogLevel {
  if (minLevel) {
    return minLevel
  }

  if (mode === 'production') {
    return 'info'
  }

  if (mode === 'test') {
    return 'warn'
  }

  return 'debug'
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_VALUE[level] >= LEVEL_VALUE[minLevel]
}

class DefaultLogger implements Logger {
  private readonly service: string
  private readonly mode: RuntimeMode
  private readonly minLevel: LogLevel
  private readonly baseContext: LogContext
  private readonly transports: LogTransport[]

  constructor(options: LoggerOptions = {}) {
    const envConfig = detectLoggerEnvConfig()

    this.service = options.service ?? 'vto'
    this.mode = options.mode ?? envConfig.mode
    this.minLevel = resolveMinLevel(this.mode, options.minLevel ?? envConfig.level)
    this.baseContext = options.baseContext ?? {}
    this.transports = []

    this.bootstrapExternalTransports({
      axiomDataset: envConfig.axiomDataset,
      axiomToken: envConfig.axiomToken,
      enableAxiom: envConfig.enableAxiom,
      enablePino: envConfig.enablePino,
      enableSentry: envConfig.enableSentry,
      sentryDsn: envConfig.sentryDsn,
    })
  }

  private bootstrapExternalTransports(input: {
    axiomDataset?: string
    axiomToken?: string
    enableAxiom: boolean
    enablePino: boolean
    enableSentry: boolean
    sentryDsn?: string
  }): void {
    if (input.enablePino) {
      this.transports.push(createPinoTransport(this.service))
    }

    if (input.enableAxiom && input.axiomToken && input.axiomDataset) {
      void createAxiomTransport({
        dataset: input.axiomDataset,
        token: input.axiomToken,
      }).then((transport) => {
        this.transports.push(transport)
      })
    }

    if (input.enableSentry && input.sentryDsn) {
      void createSentryTransport(input.sentryDsn).then((transport) => {
        this.transports.push(transport)
      })
    }
  }

  private emit(level: LogLevel, message: string, context: LogContext = {}): void {
    if (!shouldLog(level, this.minLevel)) {
      return
    }

    const event: LogEvent = {
      context: {
        ...this.baseContext,
        ...context,
      },
      level,
      message,
      mode: this.mode,
      service: this.service,
      timestamp: new Date().toISOString(),
    }

    for (const transport of this.transports) {
      transport(event)
    }
  }

  debug(message: string, context?: LogContext): void {
    this.emit('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.emit('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.emit('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.emit('error', message, context)
  }

  fatal(message: string, context?: LogContext): void {
    this.emit('fatal', message, context)
  }

  child(context: LogContext): Logger {
    return new DefaultLogger({
      baseContext: {
        ...this.baseContext,
        ...context,
      },
      minLevel: this.minLevel,
      mode: this.mode,
      service: this.service,
    })
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return new DefaultLogger(options)
}

export const logger = createLogger()

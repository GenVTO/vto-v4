import pino from 'pino'

import type { LogEvent, LogTransport } from './types'

interface PinoLikeLogger {
  debug(context: Record<string, unknown>, message: string): void
  info(context: Record<string, unknown>, message: string): void
  warn(context: Record<string, unknown>, message: string): void
  error(context: Record<string, unknown>, message: string): void
  fatal?(context: Record<string, unknown>, message: string): void
}

function eventToPinoContext(event: LogEvent): Record<string, unknown> {
  return {
    ...event.context,
    mode: event.mode,
    timestamp: event.timestamp,
  }
}

function loggerTransport(logger: PinoLikeLogger): LogTransport {
  return (event) => {
    const context = eventToPinoContext(event)

    if (event.level === 'fatal' && logger.fatal) {
      logger.fatal(context, event.message)
      return
    }

    logger[event.level as 'debug' | 'info' | 'warn' | 'error'](context, event.message)
  }
}

export function createPinoTransport(service: string): LogTransport {
  const logger = pino({
    base: { service },
    name: service,
  }) as unknown as PinoLikeLogger
  return loggerTransport(logger)
}

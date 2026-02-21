import * as Sentry from '@sentry/cloudflare'

import type { LogEvent, LogLevel, LogTransport } from './types'

function noopTransport(): LogTransport {
  return () => {}
}

function loadSentrySdk(): typeof Sentry | null {
  try {
    return Sentry
  } catch {
    return null
  }
}

export async function createSentryTransport(dsn: string): Promise<LogTransport> {
  const sentry = loadSentrySdk()
  if (!sentry) {
    return noopTransport()
  }

  void dsn

  const sentryLevelMap: Record<LogLevel, Sentry.SeverityLevel> = {
    debug: 'debug',
    error: 'error',
    fatal: 'fatal',
    info: 'info',
    warn: 'warning',
  }

  return (event: LogEvent) => {
    const context = {
      extra: {
        ...event.context,
        mode: event.mode,
        service: event.service,
        timestamp: event.timestamp,
      },
      level: sentryLevelMap[event.level],
      tags: {
        mode: event.mode,
        service: event.service,
      },
    }

    if (event.level === 'error' || event.level === 'fatal') {
      sentry.captureException(new Error(event.message), context)
      return
    }

    sentry.captureMessage(event.message, context)
  }
}

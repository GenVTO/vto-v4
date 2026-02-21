import type { RuntimeMode } from '../env'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type LogContext = Record<string, unknown>

export interface LogEvent {
  context: LogContext
  level: LogLevel
  message: string
  mode: RuntimeMode
  service: string
  timestamp: string
}

export type LogTransport = (event: LogEvent) => void

export interface ExternalTransportOptions {
  mode: RuntimeMode
  service: string
}

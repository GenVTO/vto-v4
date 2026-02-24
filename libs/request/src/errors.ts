import type { HttpStatus } from '@vto/types/http-status'

export interface RequestErrorOptions {
  details?: unknown
  message: string
  statusCode: number | null
  statusName: HttpStatus | null
}

export class RequestError extends Error {
  readonly statusCode: number | null
  readonly statusName: HttpStatus | null
  readonly details?: unknown

  constructor({ details, message, statusCode, statusName }: RequestErrorOptions) {
    super(message)
    this.statusCode = statusCode
    this.statusName = statusName
    this.details = details
  }
}

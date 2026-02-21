import type { HttpStatus } from '@vto/types/http-status'

export class RequestError extends Error {
  readonly statusCode: number | null
  readonly statusName: HttpStatus | null
  readonly details?: unknown

  constructor(
    message: string,
    statusCode: number | null,
    statusName: HttpStatus | null,
    details?: unknown,
  ) {
    super(message)
    this.statusCode = statusCode
    this.statusName = statusName
    this.details = details
  }
}

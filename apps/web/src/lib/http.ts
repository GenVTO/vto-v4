import type { ApiErrorCode } from '@vto/types'
import type { APIContext } from 'astro'

// oxlint-disable-next-line import/no-nodejs-modules
import { constants } from 'node:http2'

export type HttpStatus = keyof typeof constants

export interface ApiErrorInput {
  code: ApiErrorCode
  details?: Record<string, unknown>
  message: string
  status: HttpStatus
}

export function json(data: unknown, status: HttpStatus = 'HTTP_STATUS_OK'): Response {
  return Response.json(data, { status: Number(constants[status]) })
}

export function requestId(context: APIContext): string {
  const incoming = context.request.headers.get('x-request-id')
  if (incoming) {
    return incoming
  }

  return crypto.randomUUID()
}

export function apiError(context: APIContext, input: ApiErrorInput): Response {
  return json(
    {
      code: input.code,
      details: input.details,
      message: input.message,
      request_id: requestId(context),
    },
    input.status,
  )
}

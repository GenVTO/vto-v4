import type { APIRoute } from 'astro'

import { TryOnGatewayError } from '@vto/try-on'

import {
  authenticateRequest,
  parseCreateTryOnBody,
  statusFromGatewayError,
} from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { configureRuntimeBindings, runtime } from '@/lib/runtime'

function internalError(context: Parameters<APIRoute>[0]): Response {
  return apiError(context, {
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error creating try-on job.',
    status: 'HTTP_STATUS_INTERNAL_SERVER_ERROR',
  })
}

async function createJobResponse(
  context: Parameters<APIRoute>[0],
  request_id: string,
): Promise<Response> {
  const authResult = await authenticateRequest(context)
  if (authResult instanceof Response) {
    return authResult
  }

  const payload = await parseCreateTryOnBody(context)
  if (payload instanceof Response) {
    return payload
  }

  const result = await runtime.tryOnGateway.runTryOn(payload, authResult)
  return json({ request_id, ...result }, 'HTTP_STATUS_ACCEPTED')
}

export const POST: APIRoute = async (context) => {
  const bindings = (context.locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env
  configureRuntimeBindings(bindings)

  const request_id = requestId(context)
  const requestLogger = runtime.logger.child({
    path: '/api/v1/try-on',
    request_id,
  })
  requestLogger.info('Try-on create request received')

  try {
    const response = await createJobResponse(context, request_id)
    requestLogger.info('Try-on create request completed', {
      status: response.status,
    })
    return response
  } catch (error) {
    if (error instanceof TryOnGatewayError) {
      requestLogger.warn('Try-on gateway error', {
        code: error.code,
        message: error.message,
      })
      return apiError(context, {
        code: error.code,
        details: error.details,
        message: error.message,
        status: statusFromGatewayError(error),
      })
    }

    requestLogger.error('Unexpected try-on create error')
    return internalError(context)
  }
}

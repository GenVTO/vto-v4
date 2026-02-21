import type { APIRoute } from 'astro'

import { TryOnGatewayError } from '@vto/try-on'

import {
  authenticateRequest,
  parseCreateTryOnBody,
  statusFromGatewayError,
} from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { runtime } from '@/lib/runtime'

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
  const request_id = requestId(context)

  try {
    return await createJobResponse(context, request_id)
  } catch (error) {
    if (error instanceof TryOnGatewayError) {
      return apiError(context, {
        code: error.code,
        details: error.details,
        message: error.message,
        status: statusFromGatewayError(error),
      })
    }

    return internalError(context)
  }
}

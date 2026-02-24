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

function summarizeTryOnRequest(
  payload: Exclude<Awaited<ReturnType<typeof parseCreateTryOnBody>>, Response>,
) {
  return {
    customer_id: payload.customer_id ?? null,
    has_metadata: Boolean(payload.metadata),
    idempotency_key: payload.idempotency_key ?? null,
    model: payload.model ?? 'advanced',
    product_id: payload.product_id,
    product_image_url: payload.product_image_url,
    shop_domain: payload.shop_domain,
    user_image: payload.user_image ? `inline_data(len=${payload.user_image.length})` : null,
    user_image_url: payload.user_image_url ?? null,
    visitor_id: payload.visitor_id,
  }
}

async function createJobResponse(
  context: Parameters<APIRoute>[0],
  request_id: string,
  requestLogger: ReturnType<typeof runtime.logger.child>,
  requestReceivedAt: string,
): Promise<Response> {
  const authResult = await authenticateRequest(context)
  if (authResult instanceof Response) {
    return authResult
  }

  const payload = await parseCreateTryOnBody(context, authResult)
  if (payload instanceof Response) {
    return payload
  }
  requestLogger.info('Try-on create payload parsed', {
    payload: summarizeTryOnRequest(payload),
  })

  const payloadWithInternalMetadata = {
    ...payload,
    metadata: {
      ...payload.metadata,
      __vto_internal: {
        ...(payload.metadata?.__vto_internal as Record<string, unknown> | undefined),
        api_request_received_at: requestReceivedAt,
      },
    },
  }

  const result = await runtime.tryOnGateway.runTryOn(payloadWithInternalMetadata, authResult)
  requestLogger.info('Try-on create gateway response', {
    response: result,
  })
  return json({ request_id, ...result }, 'HTTP_STATUS_ACCEPTED')
}

export const POST: APIRoute = async (context) => {
  const bindings = (context.locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env
  configureRuntimeBindings(bindings)

  const request_id = requestId(context)
  const requestReceivedAt = new Date().toISOString()
  const requestLogger = runtime.logger.child({
    path: '/api/v1/try-on',
    request_id,
  })
  requestLogger.info('Try-on create request received')

  try {
    const response = await createJobResponse(context, request_id, requestLogger, requestReceivedAt)
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

import type { APIRoute } from 'astro'

import { tryOnHistoryQuerySchema } from '@vto/types/schemas'

import { authenticateRequest } from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { configureRuntimeBindings, runtime } from '@/lib/runtime'

export const GET: APIRoute = async (context) => {
  const bindings = (context.locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env
  configureRuntimeBindings(bindings)

  const request_id = requestId(context)
  const requestLogger = runtime.logger.child({
    path: '/api/v1/try-on/history',
    request_id,
  })
  requestLogger.info('Try-on history request received')
  const authResult = await authenticateRequest(context)

  if (authResult instanceof Response) {
    requestLogger.warn('Try-on history authentication failed', {
      status: authResult.status,
    })
    return authResult
  }

  const url = new URL(context.request.url)
  const parsed = tryOnHistoryQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))

  if (!parsed.success) {
    requestLogger.warn('Try-on history query validation failed', {
      issue_count: parsed.error.issues.length,
    })
    return apiError(context, {
      code: 'INVALID_INPUT',
      details: { issues: parsed.error.issues },
      message: 'Invalid query params.',
      status: 'HTTP_STATUS_BAD_REQUEST',
    })
  }

  const result = await runtime.tryOnGateway.getHistory(parsed.data, authResult)
  requestLogger.debug('Try-on history request resolved', {
    items: result.items.length,
    total: result.total,
  })
  return json({ request_id, ...result })
}

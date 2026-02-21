import type { APIRoute } from 'astro'

import { tryOnHistoryQuerySchema } from '@vto/types/schemas'

import { authenticateRequest } from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { runtime } from '@/lib/runtime'

export const GET: APIRoute = async (context) => {
  const request_id = requestId(context)
  const authResult = await authenticateRequest(context)

  if (authResult instanceof Response) {
    return authResult
  }

  const url = new URL(context.request.url)
  const parsed = tryOnHistoryQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))

  if (!parsed.success) {
    return apiError(context, {
      code: 'INVALID_INPUT',
      details: { issues: parsed.error.issues },
      message: 'Invalid query params.',
      status: 'HTTP_STATUS_BAD_REQUEST',
    })
  }

  const result = await runtime.tryOnGateway.getHistory(parsed.data, authResult)
  return json({ request_id, ...result })
}

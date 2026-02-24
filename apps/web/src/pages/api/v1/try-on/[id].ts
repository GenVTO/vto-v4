import type { APIRoute } from 'astro'

import { authenticateRequest } from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { configureRuntimeBindings, runtime } from '@/lib/runtime'

function missingIdResponse(context: Parameters<APIRoute>[0]): Response {
  return apiError(context, {
    code: 'INVALID_INPUT',
    message: 'Missing job id.',
    status: 'HTTP_STATUS_BAD_REQUEST',
  })
}

function missingJobResponse(context: Parameters<APIRoute>[0]): Response {
  return apiError(context, {
    code: 'INVALID_INPUT',
    message: 'Job not found.',
    status: 'HTTP_STATUS_NOT_FOUND',
  })
}

async function getAuthorizedJob(
  context: Parameters<APIRoute>[0],
  id: string,
): Promise<Response | Awaited<ReturnType<typeof runtime.tryOnGateway.getJobStatus>>> {
  const authResult = await authenticateRequest(context)
  if (authResult instanceof Response) {
    return authResult
  }

  return runtime.tryOnGateway.getJobStatus(id, authResult)
}

function setupRequest(context: Parameters<APIRoute>[0]) {
  const bindings = (context.locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env
  configureRuntimeBindings(bindings)
  const request_id = requestId(context)
  const { id } = context.params
  const requestLogger = runtime.logger.child({
    job_id: id ?? null,
    path: '/api/v1/try-on/:id',
    request_id,
  })
  return { id, requestLogger, request_id }
}

export const GET: APIRoute = async (context) => {
  const { id, requestLogger, request_id } = setupRequest(context)
  requestLogger.info('Try-on status request received')

  if (!id) {
    requestLogger.warn('Missing job id in status request')
    return missingIdResponse(context)
  }

  const job = await getAuthorizedJob(context, id)
  if (job instanceof Response) {
    requestLogger.warn('Authorization failed for try-on status request', {
      status: job.status,
    })
    return job
  }

  if (!job) {
    requestLogger.warn('Try-on status request job not found')
    return missingJobResponse(context)
  }

  requestLogger.debug('Try-on status request resolved', {
    provider_job_id: job.provider_job_id ?? null,
    result_url: job.result_url ?? null,
    status: job.status,
  })
  return json({
    id: job.id,
    provider_job_id: job.provider_job_id ?? null,
    request_id,
    result_url: job.result_url ?? null,
    status: job.status,
    updated_at: job.updated_at,
  })
}

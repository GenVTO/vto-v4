import type { APIRoute } from 'astro'

import { authenticateRequest } from '@/lib/api-helpers'
import { apiError, json, requestId } from '@/lib/http'
import { runtime } from '@/lib/runtime'

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

export const GET: APIRoute = async (context) => {
  const request_id = requestId(context)
  const { id } = context.params

  if (!id) {
    return missingIdResponse(context)
  }

  const job = await getAuthorizedJob(context, id)
  if (job instanceof Response) {
    return job
  }

  if (!job) {
    return missingJobResponse(context)
  }

  return json({
    id: job.id,
    provider_job_id: job.provider_job_id ?? null,
    request_id,
    result_url: job.result_url ?? null,
    status: job.status,
    updated_at: job.updated_at,
  })
}

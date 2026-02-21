import type { TryOnGatewayError } from '@vto/try-on'
import type { CreateTryOnRequest } from '@vto/types'
import type { APIContext } from 'astro'

import { createTryOnRequestSchema } from '@vto/types/schemas'

import type { HttpStatus } from './http'

import { readApiKey } from './auth'
import { apiError } from './http'
import { runtime } from './runtime'

interface TenantAuth {
  shopDomain: string
  tenantId: string
}

export function statusFromGatewayError(error: TryOnGatewayError): HttpStatus {
  if (error.code === 'INSUFFICIENT_CREDITS') {
    return 'HTTP_STATUS_PAYMENT_REQUIRED'
  }

  if (error.code === 'UNAUTHORIZED') {
    return 'HTTP_STATUS_UNAUTHORIZED'
  }

  if (error.code === 'INVALID_INPUT') {
    return 'HTTP_STATUS_BAD_REQUEST'
  }

  return 'HTTP_STATUS_INTERNAL_SERVER_ERROR'
}

export async function authenticateRequest(context: APIContext): Promise<Response | TenantAuth> {
  const apiKey = readApiKey(context)
  if (!apiKey) {
    return apiError(context, {
      code: 'UNAUTHORIZED',
      message: 'Missing API key.',
      status: 'HTTP_STATUS_UNAUTHORIZED',
    })
  }

  const tenant = await runtime.db.validateApiKey(apiKey)
  if (!tenant) {
    return apiError(context, {
      code: 'UNAUTHORIZED',
      message: 'Invalid API key.',
      status: 'HTTP_STATUS_UNAUTHORIZED',
    })
  }

  return tenant
}

function parseMultipartBody(form: FormData): Record<string, unknown> {
  const file = form.get('user_image')

  return {
    customer_id: form.get('customer_id'),
    idempotency_key: form.get('idempotency_key'),
    model: form.get('model'),
    product_id: form.get('product_id'),
    product_image_url: form.get('product_image_url'),
    shop_domain: form.get('shop_domain'),
    user_image: file instanceof File ? `upload://${file.name}` : undefined,
    visitor_id: form.get('visitor_id'),
  }
}

export async function parseCreateTryOnBody(
  context: APIContext,
): Promise<CreateTryOnRequest | Response> {
  try {
    const contentType = context.request.headers.get('content-type') ?? ''
    const raw = contentType.includes('multipart/form-data')
      ? parseMultipartBody(await context.request.formData())
      : ((await context.request.json()) as Record<string, unknown>)

    const parsed = createTryOnRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return apiError(context, {
        code: 'INVALID_INPUT',
        details: { issues: parsed.error.issues },
        message: 'Invalid request payload.',
        status: 'HTTP_STATUS_BAD_REQUEST',
      })
    }

    return parsed.data
  } catch {
    return apiError(context, {
      code: 'INVALID_INPUT',
      message: 'Body must be valid JSON or multipart form-data.',
      status: 'HTTP_STATUS_BAD_REQUEST',
    })
  }
}

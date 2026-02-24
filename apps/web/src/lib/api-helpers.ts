import type { TryOnGatewayError } from '@vto/try-on'
import type { CreateTryOnRequest } from '@vto/types'
import type { HttpStatus } from '@vto/types/http-status'
import type { APIContext } from 'astro'

import { createTryOnRequestSchema } from '@vto/types/schemas'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

import { readApiKey } from './auth'
import { apiError } from './http'
import { runtime } from './runtime'

interface TenantAuth {
  shopDomain: string
  tenantId: string
}

const INPUT_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 30
const MAX_PATH_SEGMENT_LENGTH = 80

const multipartTryOnSchema = zfd.formData({
  customer_id: zfd.text(z.string().optional()),
  idempotency_key: zfd.text(z.string().optional()),
  model: zfd.text(z.string().optional()),
  product_id: zfd.text(z.string().optional()),
  product_image: zfd.file(z.instanceof(File).optional()),
  product_image_url: zfd.text(z.string().optional()),
  shop_domain: zfd.text(z.string().optional()),
  user_image: zfd.file(z.instanceof(File).optional()),
  user_image_url: zfd.text(z.string().optional()),
  visitor_id: zfd.text(z.string().optional()),
})

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
  const requestLogger = runtime.logger.child({
    path: new URL(context.request.url).pathname,
  })
  const apiKey = readApiKey(context)
  if (!apiKey) {
    requestLogger.warn('Authentication failed: missing api key')
    return apiError(context, {
      code: 'UNAUTHORIZED',
      message: 'Missing API key.',
      status: 'HTTP_STATUS_UNAUTHORIZED',
    })
  }

  const tenant = await runtime.db.validateApiKey(apiKey)
  if (!tenant) {
    requestLogger.warn('Authentication failed: invalid api key')
    return apiError(context, {
      code: 'UNAUTHORIZED',
      message: 'Invalid API key.',
      status: 'HTTP_STATUS_UNAUTHORIZED',
    })
  }

  requestLogger.debug('Authentication succeeded', {
    shop_domain: tenant.shopDomain,
    tenant_id: tenant.tenantId,
  })
  return tenant
}

function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, MAX_PATH_SEGMENT_LENGTH)
}

function extensionForContentType(contentType: string): string {
  const normalized = contentType.toLowerCase()
  if (normalized.includes('png')) {
    return 'png'
  }
  if (normalized.includes('webp')) {
    return 'webp'
  }
  if (normalized.includes('gif')) {
    return 'gif'
  }
  if (normalized.includes('avif')) {
    return 'avif'
  }
  return 'jpg'
}

async function uploadInputImageAndSignUrl(input: {
  file: File
  imageType: 'garment' | 'user'
  productId: string
  tenant: TenantAuth
  visitorId: string
}): Promise<{ key: string; signedUrl: string }> {
  const contentType = input.file.type || 'image/jpeg'
  const fileBytes = await input.file.arrayBuffer()
  const shop = sanitizePathSegment(input.tenant.shopDomain) || 'unknown-shop'
  const tenant = sanitizePathSegment(input.tenant.tenantId) || 'unknown-tenant'
  const visitor = sanitizePathSegment(input.visitorId) || 'unknown-visitor'
  const product = sanitizePathSegment(input.productId) || 'unknown-product'
  const ext = extensionForContentType(contentType)
  const key = `try-on/inputs/${shop}/${tenant}/${visitor}/${product}/${input.imageType}-${crypto.randomUUID()}.${ext}`

  await runtime.storage.put({
    body: fileBytes,
    contentType,
    key,
    metadata: {
      image_type: input.imageType,
      product_id: input.productId,
      source: 'multipart-form-upload',
      tenant_id: input.tenant.tenantId,
      visitor_id: input.visitorId,
    },
  })
  const signedUrl = await runtime.storage.getSignedUrl(key, {
    expiresInSeconds: INPUT_IMAGE_SIGNED_URL_TTL_SECONDS,
    method: 'GET',
  })
  return { key, signedUrl }
}

async function parseMultipartBody(
  form: FormData,
  tenant: TenantAuth,
): Promise<
  { success: true; data: Record<string, unknown> } | { success: false; issues: z.core.$ZodIssue[] }
> {
  const parsed = multipartTryOnSchema.safeParse(form)
  if (!parsed.success) {
    return { issues: parsed.error.issues, success: false }
  }

  const {
    customer_id,
    idempotency_key,
    model,
    product_id,
    product_image_url,
    shop_domain,
    user_image_url,
    visitor_id,
    user_image,
    product_image,
  } = parsed.data

  const payload: Record<string, unknown> = {
    customer_id,
    idempotency_key,
    model,
    product_id,
    product_image_url,
    shop_domain,
    user_image_url,
    visitor_id,
  }

  const internalMetadata: Record<string, unknown> = {}

  if (user_image) {
    const uploadedUserImage = await uploadInputImageAndSignUrl({
      file: user_image,
      imageType: 'user',
      productId: product_id ?? '',
      tenant,
      visitorId: visitor_id ?? '',
    })
    payload.user_image_url = uploadedUserImage.signedUrl
    internalMetadata.user_image_key = uploadedUserImage.key
  }

  if (product_image) {
    const uploadedProductImage = await uploadInputImageAndSignUrl({
      file: product_image,
      imageType: 'garment',
      productId: product_id ?? '',
      tenant,
      visitorId: visitor_id ?? '',
    })
    payload.product_image_url = uploadedProductImage.signedUrl
    internalMetadata.product_image_key = uploadedProductImage.key
  }

  if (Object.keys(internalMetadata).length > 0) {
    payload.metadata = {
      __vto_internal: {
        ...internalMetadata,
        image_upload_completed_at: new Date().toISOString(),
      },
    }
  }

  return { data: payload, success: true }
}

export async function parseCreateTryOnBody(
  context: APIContext,
  tenant: TenantAuth,
): Promise<CreateTryOnRequest | Response> {
  const requestLogger = runtime.logger.child({
    path: new URL(context.request.url).pathname,
  })
  try {
    const contentType = context.request.headers.get('content-type') ?? ''
    let raw: unknown

    if (contentType.includes('multipart/form-data')) {
      const multipartParsed = await parseMultipartBody(await context.request.formData(), tenant)
      if (!multipartParsed.success) {
        requestLogger.warn('Request body validation failed', {
          content_type: contentType || 'unknown',
          issue_count: multipartParsed.issues.length,
          issues: multipartParsed.issues,
        })
        return apiError(context, {
          code: 'INVALID_INPUT',
          details: { issues: multipartParsed.issues },
          message: 'Invalid request payload.',
          status: 'HTTP_STATUS_BAD_REQUEST',
        })
      }
      raw = multipartParsed.data
    } else {
      raw = await context.request.json()
    }

    const parsed = createTryOnRequestSchema.safeParse(raw)
    if (!parsed.success) {
      requestLogger.warn('Request body validation failed', {
        content_type: contentType || 'unknown',
        issue_count: parsed.error.issues.length,
        issues: parsed.error.issues,
      })
      return apiError(context, {
        code: 'INVALID_INPUT',
        details: { issues: parsed.error.issues },
        message: 'Invalid request payload.',
        status: 'HTTP_STATUS_BAD_REQUEST',
      })
    }

    requestLogger.debug('Request body parsed', {
      content_type: contentType || 'unknown',
      model: parsed.data.model ?? 'advanced',
      shop_domain: parsed.data.shop_domain,
    })
    return parsed.data
  } catch {
    requestLogger.warn('Request body parse failed: invalid json or multipart')
    return apiError(context, {
      code: 'INVALID_INPUT',
      message: 'Body must be valid JSON or multipart form-data.',
      status: 'HTTP_STATUS_BAD_REQUEST',
    })
  }
}

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
  const visitor = sanitizePathSegment(input.visitorId) || 'unknown-visitor'
  const product = sanitizePathSegment(input.productId) || 'unknown-product'
  const ext = extensionForContentType(contentType)
  // Store temporarily in input/ until we have a job ID. The try-on service should move this or we accept it lives outside the job folder structure for now.
  // Wait, the user wants `shop/jobid/<input|result>/image`.
  // At this point (parsing body), we DO NOT have a job ID yet.
  // We can generate a request ID earlier and use it as a correlation ID, or we can use a temporary location.
  // However, the user request is specific about the path structure.
  // If we don't have the job ID, we can't put it in the job ID folder.
  // Strategy:
  // 1. Upload to a temporary location `temp/inputs/...`
  // 2. Or generate the job ID here? No, the DB generates the ID.
  // 3. Or accept that inputs might need to be moved or just use a different path for initial upload.

  // Let's look at the previous implementation:
  // `inputs/${shop}/${tenant}/${visitor}/${product}/${input.imageType}-${crypto.randomUUID()}.${ext}`

  // The user wants: `shop/jobid/<input|result>/image`

  // Since we don't have the job ID yet, we have a dilemma.
  // Options:
  // A) Generate UUID for job ID here and pass it to DB (if DB allows inserting with ID).
  // B) Upload to temp, then copy to final location after job creation.
  // C) Upload to `shop/pending-inputs/...` and let it stay there.

  // Given the strict requirement "peferiria que el path fuera: ...", I should probably try to align as much as possible.
  // But if I don't have the ID, I physically can't.

  // Let's stick to the current path for now, but maybe simplify it to `shop/inputs/...` to match the style?
  // The user said: "shop/jobid/<input|result>/image"
  // This implies inputs should also be under the job ID.

  // If I can't satisfy this for the initial upload, I will keep the current path but maybe clean it up.
  // Actually, I can use the request ID or a temporary ID.

  // Let's look at `uploadInputImageAndSignUrl` call site. It's called inside `parseMultipartBody`.
  // `parseCreateTryOnBody` calls `parseMultipartBody`.
  // Then `createJob` is called in `try-on.ts`.

  // If I want to support this path, I might need to move the file AFTER job creation.
  // But that's expensive (copy + delete).

  // Let's ask the user or just use a "inputs" folder at the root for now, or `shop/inputs/...`.
  // The user specifically mentioned "shop/jobid/...".

  // Let's try to see if I can generate the ID.
  // `libs/db` creates the job. `libs/supabase-db` uses `default` for ID usually, but I can check if I can supply it.

  // `libs/supabase-db/src/gateway.ts`:
  // .insert({ ... }) -> usually lets Postgres generate ID.

  // If I can't control the ID, I can't use it in the path before creation.

  // I will update the RESULT path to match the requested format: `shop/jobid/result/image`.
  // For INPUTS, I will update them to `shop/inputs/...` to be consistent with the "shop" prefix preference,
  // Even if I can't put them under jobid yet.
  // Wait, if I use `shop/inputs/request_id/...` that might be close enough?

  // Let's look at the previous change I made:
  // `inputs/${shop}/${tenant}/${visitor}/${product}/${input.imageType}-${crypto.randomUUID()}.${ext}`

  // I'll change this to start with `shop/...` as requested (implicitly by the structure).
  // The user example: "shop/jobid/<input|result>/image"

  // So:
  // Results: `${shop}/${jobId}/result/image.${ext}`
  // Inputs: `${shop}/inputs/${visitor}/${product}/${imageType}-${uuid}.${ext}` (Best effort since no job ID)

  const key = `${shop}/inputs/${visitor}/${product}/${input.imageType}-${crypto.randomUUID()}.${ext}`

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

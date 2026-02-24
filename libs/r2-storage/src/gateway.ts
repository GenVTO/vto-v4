import type {
  PersistTryOnResultInput,
  PersistTryOnResultOutput,
  PutObjectInput,
  SignedUrlOptions,
  StorageGateway,
} from '@vto/types'

import { createLogger } from '@vto/logger'

export interface R2LikeBucket {
  put(
    key: string,
    value: PutObjectInput['body'],
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>
  head(key: string): Promise<unknown | null>
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>
  delete(key: string): Promise<void>
}

export interface R2StorageGatewayOptions {
  publicBaseUrl?: string
}
const storageLogger = createLogger({ service: '@vto/r2-storage' })
const TRYON_RESULT_URL_TTL_SECONDS = 60 * 60 * 24 * 30

function sanitizeStoragePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80)
}

function extensionFromContentType(contentType: string): string {
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

function buildTryOnResultKey(input: PersistTryOnResultInput, contentType: string): string {
  const shop = sanitizeStoragePathSegment(input.shopDomain) || 'unknown-shop'
  const ext = extensionFromContentType(contentType)
  return `${shop}/${input.jobId}/res.${ext}`
}

export class R2StorageGateway implements StorageGateway {
  private readonly bucket: R2LikeBucket
  private readonly publicBaseUrl: string | null

  constructor(bucket: R2LikeBucket, options: R2StorageGatewayOptions = {}) {
    this.bucket = bucket
    this.publicBaseUrl = options.publicBaseUrl ?? null
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    storageLogger.debug('R2 put object', {
      content_type: input.contentType,
      key: input.key,
    })
    await this.bucket.put(input.key, input.body, {
      httpMetadata: { contentType: input.contentType },
    })
    return { key: input.key }
  }

  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    if (options.method === 'PUT') {
      return Promise.reject(new Error('PUT signed urls are not implemented for R2StorageGateway.'))
    }

    if (!this.publicBaseUrl) {
      storageLogger.warn('R2 getSignedUrl called without public base url')
      return Promise.reject(
        new Error('R2 public base url is required to generate signed/public urls.'),
      )
    }

    const base = this.publicBaseUrl.endsWith('/') ? this.publicBaseUrl : `${this.publicBaseUrl}/`
    const normalizedKey = key.startsWith('/') ? key.slice(1) : key
    return Promise.resolve(new URL(normalizedKey, base).toString())
  }

  async exists(key: string): Promise<boolean> {
    const head = await this.bucket.head(key)
    storageLogger.debug('R2 exists check', {
      exists: Boolean(head),
      key,
    })
    return Boolean(head)
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const sourceObject = await this.bucket.get(sourceKey)
    if (!sourceObject) {
      throw new Error(`Source key not found: ${sourceKey}`)
    }

    const body = await sourceObject.arrayBuffer()
    await this.bucket.put(destinationKey, body)
    storageLogger.debug('R2 copy object', {
      destination_key: destinationKey,
      source_key: sourceKey,
    })
  }

  async delete(key: string): Promise<void> {
    storageLogger.debug('R2 delete object', {
      key,
    })
    await this.bucket.delete(key)
  }

  async persistTryOnResult(input: PersistTryOnResultInput): Promise<PersistTryOnResultOutput> {
    storageLogger.info('Persisting try-on result in R2 storage', {
      job_id: input.jobId,
      provider: input.providerName ?? 'unknown',
      source_url: input.providerResultUrl,
    })

    const sourceResponse = await fetch(input.providerResultUrl)
    if (!sourceResponse.ok) {
      throw new Error(`Provider result download failed (${sourceResponse.status})`)
    }

    const contentTypeHeader = sourceResponse.headers.get('content-type')
    const contentType = contentTypeHeader?.split(';')[0]?.trim() || 'image/jpeg'
    const body = await sourceResponse.arrayBuffer()
    const key = buildTryOnResultKey(input, contentType)

    await this.put({
      body,
      contentType,
      key,
      metadata: {
        created_at: input.createdAt ?? '',
        job_id: input.jobId,
        provider: input.providerName ?? 'unknown',
        source: 'provider-result',
        updated_at: input.updatedAt ?? '',
        ...input.metadata,
      },
    })

    const resultUrl = await this.getSignedUrl(key, {
      expiresInSeconds: TRYON_RESULT_URL_TTL_SECONDS,
    })
    return {
      contentType,
      key,
      resultUrl,
      sizeBytes: body.byteLength,
    }
  }
}

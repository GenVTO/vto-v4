import type { PutObjectInput, SignedUrlOptions, StorageGateway } from '@vto/storage/contracts'

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
}

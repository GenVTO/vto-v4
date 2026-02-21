import type { PutObjectInput, SignedUrlOptions, StorageGateway } from '@vto/storage/contracts'

export interface R2LikeBucket {
  put(
    key: string,
    value: PutObjectInput['body'],
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>
  head(key: string): Promise<unknown | null>
  delete(key: string): Promise<void>
}

export class R2StorageGateway implements StorageGateway {
  private readonly bucket: R2LikeBucket

  constructor(bucket: R2LikeBucket) {
    this.bucket = bucket
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    await this.bucket.put(input.key, input.body, {
      httpMetadata: { contentType: input.contentType },
    })
    return { key: input.key }
  }

  getSignedUrl(_key: string, _options: SignedUrlOptions): Promise<string> {
    return Promise.reject(
      new Error('getSignedUrl must be implemented with Cloudflare runtime bindings.'),
    )
  }

  async exists(key: string): Promise<boolean> {
    const head = await this.bucket.head(key)
    return Boolean(head)
  }

  copy(_sourceKey: string, _destinationKey: string): Promise<void> {
    return Promise.reject(new Error('copy is not yet implemented for R2StorageGateway.'))
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }
}

import type { PutObjectInput, SignedUrlOptions, StorageGateway } from '@vto/types'

import { createStorageGatewayChain } from './fallback'

class FakeStorageGateway implements StorageGateway {
  readonly calls: string[] = []
  shouldFail = false

  constructor(private readonly id: string) {}

  async put(input: PutObjectInput): Promise<{ key: string }> {
    this.calls.push(`put:${input.key}`)
    if (this.shouldFail) {
      throw new Error(`put failed on ${this.id}`)
    }
    return { key: input.key }
  }

  async getSignedUrl(key: string, _options: SignedUrlOptions): Promise<string> {
    this.calls.push(`getSignedUrl:${key}`)
    if (this.shouldFail) {
      throw new Error(`getSignedUrl failed on ${this.id}`)
    }
    return `https://example.com/${this.id}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    this.calls.push(`exists:${key}`)
    if (this.shouldFail) {
      throw new Error(`exists failed on ${this.id}`)
    }
    return this.id === 'secondary'
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    this.calls.push(`copy:${sourceKey}->${destinationKey}`)
    if (this.shouldFail) {
      throw new Error(`copy failed on ${this.id}`)
    }
  }

  async delete(key: string): Promise<void> {
    this.calls.push(`delete:${key}`)
    if (this.shouldFail) {
      throw new Error(`delete failed on ${this.id}`)
    }
  }

  async persistTryOnResult(input: {
    jobId: string
    providerResultUrl: string
    shopDomain: string
  }): Promise<{ contentType: string; key: string; resultUrl: string; sizeBytes: number }> {
    this.calls.push(`persistTryOnResult:${input.jobId}`)
    if (this.shouldFail) {
      throw new Error(`persistTryOnResult failed on ${this.id}`)
    }
    return {
      contentType: 'image/jpeg',
      key: `${input.shopDomain}/${input.jobId}/result/image.jpg`,
      resultUrl: `https://example.com/${this.id}/${input.jobId}.jpg`,
      sizeBytes: 123,
    }
  }
}

describe(createStorageGatewayChain, () => {
  it('uses configured order and falls back on failure', async () => {
    const primary = new FakeStorageGateway('primary')
    primary.shouldFail = true
    const secondary = new FakeStorageGateway('secondary')

    const storage = createStorageGatewayChain({
      order: ['primary', 'secondary'],
      providers: [
        { gateway: primary, name: 'primary' },
        { gateway: secondary, name: 'secondary' },
      ],
    })

    await expect(
      storage.put({
        body: new Uint8Array([1, 2]),
        contentType: 'image/jpeg',
        key: 'tenant/job/result.jpg',
      }),
    ).resolves.toEqual({ key: 'tenant/job/result.jpg' })
    await expect(storage.exists('tenant/job/result.jpg')).resolves.toBeTruthy()
    await expect(
      storage.getSignedUrl('tenant/job/result.jpg', { expiresInSeconds: 60 }),
    ).resolves.toContain('/secondary/tenant/job/result.jpg')
  })

  it('appends configured providers not listed in order', async () => {
    const a = new FakeStorageGateway('a')
    const b = new FakeStorageGateway('b')
    const c = new FakeStorageGateway('c')
    a.shouldFail = true
    b.shouldFail = true

    const storage = createStorageGatewayChain({
      order: ['a'],
      providers: [
        { gateway: a, name: 'a' },
        { gateway: b, name: 'b' },
        { gateway: c, name: 'c' },
      ],
    })

    await expect(
      storage.put({
        body: new Uint8Array([1]),
        contentType: 'image/jpeg',
        key: 'k',
      }),
    ).resolves.toEqual({ key: 'k' })
  })
})

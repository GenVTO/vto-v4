import { createStorageGateway } from './gateway'

describe(createStorageGateway, () => {
  it('falls back to in-disk provider when no external provider is configured', async () => {
    const storage = createStorageGateway({ env: {} })
    await expect(
      storage.put({
        body: new Uint8Array([1, 2, 3]),
        contentType: 'image/jpeg',
        key: 'tenant/job/result.jpg',
      }),
    ).resolves.toEqual({ key: 'tenant/job/result.jpg' })
    await expect(
      storage.getSignedUrl('tenant/job/result.jpg', {
        expiresInSeconds: 60,
      }),
    ).resolves.toContain('file://')
  })

  it('resolves named R2 providers and uses configured fallback order', async () => {
    const writes: string[] = []
    const backupBucket = {
      async delete(_key: string) {},
      async get(_key: string) {
        return null
      },
      async head(_key: string) {
        return {}
      },
      async put(key: string) {
        writes.push(key)
      },
    }

    const storage = createStorageGateway({
      bindings: {
        TRYON_BACKUP: backupBucket,
      },
      env: {
        R2_CONFIGS_JSON: JSON.stringify([
          { binding: 'TRYON_MAIN', name: 'main', publicBaseUrl: 'https://img-main.example.com' },
          {
            binding: 'TRYON_BACKUP',
            name: 'backup',
            publicBaseUrl: 'https://img-backup.example.com',
          },
        ]),
        STORAGE_PROVIDER_ORDER: 'r2:main,r2:backup,disk',
      },
    })

    await expect(
      storage.put({
        body: new Uint8Array([1, 2, 3]),
        contentType: 'image/jpeg',
        key: 'tenant/job/result.jpg',
      }),
    ).resolves.toEqual({ key: 'tenant/job/result.jpg' })

    await expect(
      storage.getSignedUrl('tenant/job/result.jpg', {
        expiresInSeconds: 60,
      }),
    ).resolves.toBe('https://img-backup.example.com/tenant/job/result.jpg')

    expect(writes).toEqual(['tenant/job/result.jpg'])
  })
})

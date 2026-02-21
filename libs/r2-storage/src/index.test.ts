import { R2StorageGateway } from './index'

describe(R2StorageGateway, () => {
  it('writes, checks existence, and deletes objects', async () => {
    const bucket = {
      delete: vi.fn(async () => {}),
      head: vi.fn(async () => ({ etag: '123' })),
      put: vi.fn(async () => {}),
    }

    const storage = new R2StorageGateway(bucket)

    await expect(
      storage.put({
        body: new Uint8Array([1, 2, 3]),
        contentType: 'image/jpeg',
        key: 'tenant/job/result.jpg',
      }),
    ).resolves.toEqual({ key: 'tenant/job/result.jpg' })

    await expect(storage.exists('tenant/job/result.jpg')).resolves.toBeTruthy()
    await expect(storage.delete('tenant/job/result.jpg')).resolves.toBeUndefined()

    expect(bucket.put).toHaveBeenCalledTimes(1)
    expect(bucket.head).toHaveBeenCalledTimes(1)
    expect(bucket.delete).toHaveBeenCalledTimes(1)
  })

  it('rejects unimplemented methods', async () => {
    const bucket = {
      delete: vi.fn(async () => {}),
      head: vi.fn(async () => null),
      put: vi.fn(async () => {}),
    }

    const storage = new R2StorageGateway(bucket)

    await expect(storage.getSignedUrl('key', { expiresInSeconds: 60 })).rejects.toThrow(
      'getSignedUrl must be implemented',
    )
    await expect(storage.copy('source', 'destination')).rejects.toThrow(
      'copy is not yet implemented',
    )
  })
})

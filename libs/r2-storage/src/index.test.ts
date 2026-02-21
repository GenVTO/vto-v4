import { R2StorageGateway } from './index'

describe(R2StorageGateway, () => {
  it('writes, checks existence, and deletes objects', async () => {
    const bucket = {
      delete: vi.fn(async () => {}),
      get: vi.fn(async () => ({
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      })),
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

  it('creates public url and copies objects', async () => {
    const bucket = {
      delete: vi.fn(async () => {}),
      get: vi.fn(async () => ({
        arrayBuffer: async () => new Uint8Array([9, 8, 7]).buffer,
      })),
      head: vi.fn(async () => null),
      put: vi.fn(async () => {}),
    }

    const storage = new R2StorageGateway(bucket, {
      publicBaseUrl: 'https://cdn.example.com/tryon',
    })

    await expect(
      storage.getSignedUrl('tenant/job/result.jpg', { expiresInSeconds: 60 }),
    ).resolves.toBe('https://cdn.example.com/tryon/tenant/job/result.jpg')
    await expect(storage.copy('source', 'destination')).resolves.toBeUndefined()
    expect(bucket.get).toHaveBeenCalledTimes(1)
    expect(bucket.put).toHaveBeenCalledTimes(1)
  })

  it('rejects unsupported signed url mode', async () => {
    const bucket = {
      delete: vi.fn(async () => {}),
      get: vi.fn(async () => null),
      head: vi.fn(async () => null),
      put: vi.fn(async () => {}),
    }

    const storage = new R2StorageGateway(bucket, {
      publicBaseUrl: 'https://cdn.example.com/tryon',
    })

    await expect(
      storage.getSignedUrl('tenant/job/result.jpg', {
        expiresInSeconds: 60,
        method: 'PUT',
      }),
    ).rejects.toThrow('PUT signed urls are not implemented')
  })
})

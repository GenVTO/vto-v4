import type { S3Client } from '@aws-sdk/client-s3'

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

import { createS3StorageGatewayFromEnv, S3StorageGateway } from './index'

function asClient(send: (command: unknown) => Promise<unknown>): S3Client {
  return { send } as unknown as S3Client
}

describe(S3StorageGateway, () => {
  it('puts, checks existence, copies, and deletes objects', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return { ContentLength: 123 }
      }
      return {}
    })

    const gateway = new S3StorageGateway({
      bucket: 'demo-bucket',
      client: asClient(send),
      signUrl: vi.fn(async () => 'https://signed.example/get'),
    })

    await expect(
      gateway.put({
        body: new Uint8Array([1, 2, 3]),
        contentType: 'image/jpeg',
        key: 'tenant/job/result.jpg',
      }),
    ).resolves.toEqual({ key: 'tenant/job/result.jpg' })

    await expect(gateway.exists('tenant/job/result.jpg')).resolves.toBeTruthy()
    await expect(
      gateway.copy('tenant/job/result.jpg', 'tenant/job/result-copy.jpg'),
    ).resolves.toBeUndefined()
    await expect(gateway.delete('tenant/job/result-copy.jpg')).resolves.toBeUndefined()

    expect(send).toHaveBeenCalledTimes(4)
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(PutObjectCommand)
    expect(send.mock.calls[1]?.[0]).toBeInstanceOf(HeadObjectCommand)
    expect(send.mock.calls[2]?.[0]).toBeInstanceOf(CopyObjectCommand)
    expect(send.mock.calls[3]?.[0]).toBeInstanceOf(DeleteObjectCommand)
  })

  it('returns false on not found for exists', async () => {
    const send = vi.fn(async (_command: unknown) => {
      throw {
        $metadata: { httpStatusCode: 404 },
        name: 'NotFound',
      }
    })

    const gateway = new S3StorageGateway({
      bucket: 'demo-bucket',
      client: asClient(send),
      signUrl: vi.fn(async () => 'https://signed.example/get'),
    })

    await expect(gateway.exists('missing.jpg')).resolves.toBeFalsy()
  })

  it('uses public base url for GET signed url and signer for PUT', async () => {
    const signUrl = vi.fn(async (_client: unknown, command: unknown) => {
      if (command instanceof PutObjectCommand) {
        return 'https://signed.example/put'
      }
      return 'https://signed.example/get'
    })

    const gateway = new S3StorageGateway({
      bucket: 'demo-bucket',
      client: asClient(vi.fn(async () => ({}))),
      publicBaseUrl: 'https://cdn.example.com/assets',
      signUrl,
    })

    await expect(gateway.getSignedUrl('foo/bar.jpg', { expiresInSeconds: 60 })).resolves.toBe(
      'https://cdn.example.com/assets/foo/bar.jpg',
    )

    await expect(
      gateway.getSignedUrl('foo/bar.jpg', {
        expiresInSeconds: 60,
        method: 'PUT',
      }),
    ).resolves.toBe('https://signed.example/put')

    expect(signUrl).toHaveBeenCalledTimes(1)
    expect(signUrl.mock.calls[0]?.[1]).toBeInstanceOf(PutObjectCommand)
  })

  it('creates gateway from generic S3 env variables', async () => {
    const send = vi.fn(async () => ({}))

    const gateway = createS3StorageGatewayFromEnv({
      S3_ACCESS_KEY_ID: 'test-access-key',
      S3_BUCKET: 'tryon-results',
      S3_ENDPOINT: 'https://project.supabase.co/storage/v1/s3',
      S3_PUBLIC_BASE_URL: 'https://img.example.com',
      S3_SECRET_ACCESS_KEY: 'test-secret-key',
    }) as S3StorageGateway

    await expect(
      gateway.getSignedUrl('tenant/job/result.jpg', {
        expiresInSeconds: 60,
      }),
    ).resolves.toBe('https://img.example.com/tenant/job/result.jpg')

    const clientGateway = new S3StorageGateway({
      bucket: 'demo-bucket',
      client: asClient(send),
      signUrl: vi.fn(async (_client, command) =>
        command instanceof GetObjectCommand
          ? 'https://signed.example/get'
          : 'https://signed.example/put',
      ),
    })

    await expect(
      clientGateway.getSignedUrl('tenant/job/result.jpg', {
        expiresInSeconds: 60,
      }),
    ).resolves.toBe('https://signed.example/get')
  })

  it('fails when required S3 env variables are missing', () => {
    expect(() =>
      createS3StorageGatewayFromEnv({
        S3_BUCKET: 'tryon-results',
      }),
    ).toThrowError()
  })
})

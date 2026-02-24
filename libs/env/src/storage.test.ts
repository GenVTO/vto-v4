import { parseStorageEnv } from './storage'

describe(parseStorageEnv, () => {
  it('parses r2/s3 configs json and default order', () => {
    const env = parseStorageEnv({
      R2_CONFIGS_JSON: JSON.stringify([
        { binding: 'TRYON_ASSETS', bucketName: 'tryon-r2', name: 'default' },
      ]),
      S3_CONFIGS_JSON: JSON.stringify([
        {
          accessKeyId: 'key',
          bucket: 'bucket',
          endpoint: 'https://s3.example.com',
          name: 'default',
          secretAccessKey: 'secret',
        },
      ]),
    })

    expect(env.STORAGE_PROVIDER_ORDER).toEqual(['r2:default', 's3:default', 'disk'])
    expect(env.R2_CONFIGS).toHaveLength(1)
    expect(env.R2_CONFIGS[0]?.name).toBe('default')
    expect(env.S3_CONFIGS).toHaveLength(1)
    expect(env.S3_CONFIGS[0]?.name).toBe('default')
  })

  it('parses multiple r2/s3 configs and explicit order', () => {
    const env = parseStorageEnv({
      R2_CONFIGS_JSON: JSON.stringify([
        { binding: 'TRYON_MAIN', name: 'main' },
        { binding: 'TRYON_BACKUP', name: 'backup' },
      ]),
      S3_CONFIGS_JSON: JSON.stringify([
        {
          accessKeyId: 'a1',
          bucket: 'b1',
          endpoint: 'https://s3-a.example.com',
          name: 'a',
          secretAccessKey: 's1',
        },
        {
          accessKeyId: 'a2',
          bucket: 'b2',
          endpoint: 'https://s3-b.example.com',
          name: 'b',
          secretAccessKey: 's2',
        },
      ]),
      STORAGE_PROVIDER_ORDER: 's3:a,s3:b,disk',
    })

    expect(env.R2_CONFIGS).toHaveLength(2)
    expect(env.S3_CONFIGS).toHaveLength(2)
    expect(env.STORAGE_PROVIDER_ORDER).toEqual(['s3:a', 's3:b', 'disk'])
  })

  it('throws when duplicated provider names are configured', () => {
    expect(() =>
      parseStorageEnv({
        S3_CONFIGS_JSON: JSON.stringify([
          {
            accessKeyId: 'a1',
            bucket: 'b1',
            endpoint: 'https://s3-a.example.com',
            name: 'dup',
            secretAccessKey: 's1',
          },
          {
            accessKeyId: 'a2',
            bucket: 'b2',
            endpoint: 'https://s3-b.example.com',
            name: 'dup',
            secretAccessKey: 's2',
          },
        ]),
      }),
    ).toThrowError('Duplicate S3 config name "dup" in storage configuration.')
  })
})

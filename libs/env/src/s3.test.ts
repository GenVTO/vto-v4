import { parseS3Env } from './s3'

describe(parseS3Env, () => {
  it('parses generic S3 env values', () => {
    const env = parseS3Env({
      S3_ACCESS_KEY_ID: 'access-key',
      S3_BUCKET: 'tryon-assets',
      S3_ENDPOINT: 'https://project.supabase.co/storage/v1/s3',
      S3_PUBLIC_BASE_URL: 'https://img.example.com',
      S3_REGION: 'eu-west-1',
      S3_SECRET_ACCESS_KEY: 'secret-key',
      S3_SESSION_TOKEN: 'session-token',
    })

    expect(env.S3_ACCESS_KEY_ID).toBe('access-key')
    expect(env.S3_BUCKET).toBe('tryon-assets')
    expect(env.S3_ENDPOINT).toBe('https://project.supabase.co/storage/v1/s3')
    expect(env.S3_FORCE_PATH_STYLE).toBeTruthy()
    expect(env.S3_PUBLIC_BASE_URL).toBe('https://img.example.com')
    expect(env.S3_REGION).toBe('eu-west-1')
    expect(env.S3_SECRET_ACCESS_KEY).toBe('secret-key')
    expect(env.S3_SESSION_TOKEN).toBe('session-token')
  })

  it('supports VITE aliases and defaults', () => {
    const env = parseS3Env({
      VITE_S3_ACCESS_KEY_ID: 'access-key',
      VITE_S3_BUCKET: 'tryon-assets',
      VITE_S3_ENDPOINT: 'https://s3.amazonaws.com',
      VITE_S3_FORCE_PATH_STYLE: 'false',
      VITE_S3_SECRET_ACCESS_KEY: 'secret-key',
    })

    expect(env.S3_ACCESS_KEY_ID).toBe('access-key')
    expect(env.S3_BUCKET).toBe('tryon-assets')
    expect(env.S3_ENDPOINT).toBe('https://s3.amazonaws.com')
    expect(env.S3_FORCE_PATH_STYLE).toBeFalsy()
    expect(env.S3_REGION).toBe('us-east-1')
  })
})

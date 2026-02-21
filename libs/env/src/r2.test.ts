import { parseR2Env } from './r2'

describe(parseR2Env, () => {
  it('uses bucket name as default binding name', () => {
    const env = parseR2Env({
      R2_BUCKET_NAME: 'tryon-assets',
    })

    expect(env.R2_BUCKET_NAME).toBe('tryon-assets')
    expect(env.R2_BUCKET_BINDING).toBe('tryon-assets')
  })

  it('supports explicit binding and VITE aliases', () => {
    const env = parseR2Env({
      VITE_R2_BUCKET_BINDING: 'ASSETS_BUCKET',
      VITE_R2_BUCKET_NAME: 'tryon-assets',
      VITE_R2_PUBLIC_BASE_URL: 'https://cdn.example.com/tryon',
    })

    expect(env.R2_BUCKET_BINDING).toBe('ASSETS_BUCKET')
    expect(env.R2_BUCKET_NAME).toBe('tryon-assets')
    expect(env.R2_PUBLIC_BASE_URL).toBe('https://cdn.example.com/tryon')
  })
})

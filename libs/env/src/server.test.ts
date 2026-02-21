import { parseServerEnv } from './server'

describe(parseServerEnv, () => {
  it('supports VITE_ aliases', () => {
    const env = parseServerEnv({
      VITE_API_RATE_LIMIT_BURST: '30',
      VITE_API_RATE_LIMIT_PER_MINUTE: '90',
      VITE_DEFAULT_RESULT_TTL_DAYS: '20',
      VITE_MAX_IMAGE_MB: '6',
      VITE_MAX_REQUEST_MB: '9',
      VITE_NODE_ENV: 'test',
    })

    expect(env.API_RATE_LIMIT_PER_MINUTE).toBe(90)
    expect(env.API_RATE_LIMIT_BURST).toBe(30)
    expect(env.MAX_IMAGE_MB).toBe(6)
    expect(env.MAX_REQUEST_MB).toBe(9)
    expect(env.DEFAULT_RESULT_TTL_DAYS).toBe(20)
    expect(env.NODE_ENV).toBe('test')
  })

  it('uses defaults when fields are missing', () => {
    const env = parseServerEnv({})

    expect(env.API_RATE_LIMIT_PER_MINUTE).toBe(60)
    expect(env.DEFAULT_RESULT_TTL_DAYS).toBe(15)
    expect(env.NODE_ENV).toBe('development')
  })
})

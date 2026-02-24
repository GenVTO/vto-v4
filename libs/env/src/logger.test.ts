import { parseLoggerEnv } from './logger'

describe(parseLoggerEnv, () => {
  it('treats empty optional variables as undefined', () => {
    const env = parseLoggerEnv({
      AXIOM_DATASET: '',
      AXIOM_TOKEN: '',
      LOG_ENABLE_AXIOM: 'false',
      LOG_ENABLE_PINO: 'true',
      LOG_ENABLE_SENTRY: 'false',
      LOG_LEVEL: '',
      SENTRY_DSN: '',
    })

    expect(env.AXIOM_DATASET).toBeUndefined()
    expect(env.AXIOM_TOKEN).toBeUndefined()
    expect(env.SENTRY_DSN).toBeUndefined()
    expect(env.LOG_LEVEL).toBeUndefined()
  })

  it('supports VITE aliases and valid enum values', () => {
    const env = parseLoggerEnv({
      VITE_LOG_ENABLE_PINO: 'true',
      VITE_LOG_LEVEL: 'debug',
      VITE_NODE_ENV: 'development',
    })

    expect(env.LOG_ENABLE_PINO).toBeTruthy()
    expect(env.LOG_LEVEL).toBe('debug')
    expect(env.NODE_ENV).toBe('development')
  })
})

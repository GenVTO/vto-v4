import { collectEnv, commonAliases, resolveEnvValue } from './core'

describe('env core', () => {
  it('resolves direct key first', () => {
    const value = resolveEnvValue(
      {
        FOO: 'direct',
        VITE_FOO: 'vite',
      },
      'FOO',
      { aliases: commonAliases('FOO') },
    )

    expect(value).toBe('direct')
  })

  it('resolves alias when direct key does not exist', () => {
    const value = resolveEnvValue(
      {
        VITE_FOO: 'vite',
      },
      'FOO',
      { aliases: commonAliases('FOO') },
    )

    expect(value).toBe('vite')
  })

  it('uses provided source without merging runtime env', () => {
    const env = collectEnv({
      source: {
        A: '1',
      },
    })

    expect(env).toEqual({ A: '1' })
  })
})

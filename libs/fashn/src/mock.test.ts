import { MockFashnClient } from './mock'
import { FashnTryOnProvider } from './provider'

describe('MockFashnClient', () => {
  it('returns completed status when configured without delay/failure', async () => {
    const client = new MockFashnClient({
      failRate: 0,
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const run = await client.run({
      model: 'fashn-v1.6',
      personImageUrl: 'https://cdn.example.com/person.jpg',
      productImageUrl: 'https://cdn.example.com/product.jpg',
    })

    const status = await client.status(run.id)

    expect(status.status).toBe('completed')
    expect(status.resultUrl).toContain(run.id)
  })

  it('returns failed status when configured to always fail', async () => {
    const client = new MockFashnClient({
      failRate: 1,
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const run = await client.run({
      model: 'fashn-max',
      personImageUrl: 'https://cdn.example.com/person.jpg',
      productImageUrl: 'https://cdn.example.com/product.jpg',
    })

    await expect(client.status(run.id)).resolves.toMatchObject({
      status: 'failed',
    })
  })
})

describe('FashnTryOnProvider with mock client', () => {
  it('submits and returns provider metadata', async () => {
    const provider = new FashnTryOnProvider(
      new MockFashnClient({
        failRate: 0,
        maxDelayMs: 0,
        minDelayMs: 0,
      }),
    )

    const submit = await provider.submit({
      model: 'normal',
      personImageUrl: 'https://cdn.example.com/person.jpg',
      productImageUrl: 'https://cdn.example.com/product.jpg',
    })

    expect(submit.provider).toBe('fashn')
    expect(submit.providerJobId).toContain('fashn_')

    await expect(provider.status(submit.providerJobId)).resolves.toMatchObject({
      status: 'completed',
    })
  })
})

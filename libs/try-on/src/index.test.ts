import { createInMemoryDbGateway } from '@vto/db'

import type { TryOnProvider } from './index'

import { createTryOnGateway } from './index'

function providerMock(): TryOnProvider {
  const states = new Map<string, number>()

  return {
    status(providerJobId) {
      const count = states.get(providerJobId) ?? 0
      if (count === 0) {
        states.set(providerJobId, 1)
        return Promise.resolve({ status: 'processing' })
      }
      return Promise.resolve({
        resultUrl: `https://mock.example.com/${providerJobId}.jpg`,
        status: 'completed',
      })
    },
    submit() {
      const id = `provider_${crypto.randomUUID()}`
      states.set(id, 0)
      return Promise.resolve({
        acceptedAt: new Date().toISOString(),
        provider: 'fashn',
        providerJobId: id,
      })
    },
  }
}

describe(createTryOnGateway, () => {
  it('creates a job and charges one credit after provider accepts', async () => {
    const db = createInMemoryDbGateway({
      seedTenants: [
        {
          apiKey: 'k1',
          credits: 2,
          shopDomain: 'demo-shop.myshopify.com',
          tenantId: 'tenant_1',
        },
      ],
    })

    const gateway = createTryOnGateway({
      db,
      modelProviderMap: { advanced: 'fashn', normal: 'fashn' },
      providers: { fashn: providerMock() },
    })

    const created = await gateway.runTryOn(
      {
        model: 'advanced',
        product_id: 'p-1',
        product_image_url: 'https://cdn.example.com/p.jpg',
        shop_domain: 'demo-shop.myshopify.com',
        user_image_url: 'https://cdn.example.com/u.jpg',
        visitor_id: 'visitor_12345678',
      },
      { shopDomain: 'demo-shop.myshopify.com', tenantId: 'tenant_1' },
    )

    expect(created.credits_charged).toBe(1)
    expect(created.status).toBe('processing')

    const once = await gateway.getJobStatus(created.job_id, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })
    expect(once?.status).toBe('processing')

    const twice = await gateway.getJobStatus(created.job_id, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })
    expect(twice?.status).toBe('completed')
    expect(twice?.result_url).toContain('https://mock.example.com/')
  })

  it('returns cache hit without charging credits', async () => {
    const db = createInMemoryDbGateway({
      seedTenants: [
        {
          apiKey: 'k1',
          credits: 2,
          shopDomain: 'demo-shop.myshopify.com',
          tenantId: 'tenant_1',
        },
      ],
    })

    const gateway = createTryOnGateway({
      db,
      modelProviderMap: { advanced: 'fashn', normal: 'fashn' },
      providers: { fashn: providerMock() },
    })

    const payload = {
      model: 'advanced' as const,
      product_id: 'p-1',
      product_image_url: 'https://cdn.example.com/p.jpg',
      shop_domain: 'demo-shop.myshopify.com',
      user_image_url: 'https://cdn.example.com/u.jpg',
      visitor_id: 'visitor_12345678',
    }

    const first = await gateway.runTryOn(payload, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })

    await gateway.getJobStatus(first.job_id, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })
    await gateway.getJobStatus(first.job_id, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })

    const second = await gateway.runTryOn(payload, {
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })

    expect(second.cache_hit).toBeTruthy()
    expect(second.credits_charged).toBe(0)
    expect(second.status).toBe('completed')
  })
})

import { createInMemoryDbGateway } from './index'

function createGateway() {
  return createInMemoryDbGateway({
    seedTenants: [
      {
        apiKey: 'api_key_1',
        credits: 2,
        shopDomain: 'demo-shop.myshopify.com',
        tenantId: 'tenant_1',
      },
    ],
  })
}

describe('InMemoryDbGateway', () => {
  it('validates API key and tenant mapping', async () => {
    const gateway = createGateway()

    await expect(gateway.validateApiKey('api_key_1')).resolves.toEqual({
      shopDomain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
    })
    await expect(gateway.validateApiKey('invalid')).resolves.toBeNull()
  })

  it('reserves credits and throws when exhausted', async () => {
    const gateway = createGateway()

    await expect(gateway.hasCredits('tenant_1')).resolves.toBeTruthy()
    await expect(gateway.reserveCredit('tenant_1')).resolves.toBeUndefined()
    await expect(gateway.reserveCredit('tenant_1')).resolves.toBeUndefined()
    await expect(gateway.hasCredits('tenant_1')).resolves.toBeFalsy()
    await expect(gateway.reserveCredit('tenant_1')).rejects.toThrow('No credits')
  })

  it('creates and updates jobs, and supports idempotency lookup', async () => {
    const gateway = createGateway()
    const job = await gateway.createJob({
      model: 'advanced',
      product_id: 'product-1',
      product_image_url: 'https://cdn.example.com/product.jpg',
      shop_domain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
      userImageHash: 'hash-1',
      user_image_url: 'https://cdn.example.com/user.jpg',
      visitor_id: 'visitor-123456',
    })

    await gateway.saveJobIdempotency('tenant_1', 'idem-1', job.id)
    await expect(gateway.findJobByIdempotency('tenant_1', 'idem-1')).resolves.toMatchObject({
      id: job.id,
      status: 'queued',
    })

    await gateway.updateJobStatus({
      jobId: job.id,
      providerJobId: 'provider-1',
      status: 'processing',
    })

    await expect(gateway.getJob(job.id)).resolves.toMatchObject({
      credits_charged: 1,
      provider_job_id: 'provider-1',
      status: 'processing',
    })
  })

  it('returns cached completed result and history pagination', async () => {
    const gateway = createGateway()

    const baseInput = {
      model: 'advanced' as const,
      product_id: 'product-1',
      product_image_url: 'https://cdn.example.com/product.jpg',
      shop_domain: 'demo-shop.myshopify.com',
      tenantId: 'tenant_1',
      userImageHash: 'hash-1',
      user_image_url: 'https://cdn.example.com/user.jpg',
      visitor_id: 'visitor-123456',
    }

    const job1 = await gateway.createJob(baseInput)
    await gateway.updateJobStatus({
      jobId: job1.id,
      resultUrl: 'https://cdn.example.com/result-1.jpg',
      status: 'completed',
    })

    const job2 = await gateway.createJob({
      ...baseInput,
      product_id: 'product-2',
      userImageHash: 'hash-2',
    })
    await gateway.updateJobStatus({ jobId: job2.id, status: 'failed' })

    await expect(
      gateway.findCachedResult({
        productId: 'product-1',
        shopDomain: 'demo-shop.myshopify.com',
        userImageHash: 'hash-1',
      }),
    ).resolves.toMatchObject({
      id: job1.id,
      result_url: 'https://cdn.example.com/result-1.jpg',
      status: 'completed',
    })

    await expect(
      gateway.getHistory({
        limit: 1,
        offset: 0,
        shop_domain: 'demo-shop.myshopify.com',
        visitor_id: 'visitor-123456',
      }),
    ).resolves.toMatchObject({
      items: [expect.any(Object)],
      total: 2,
    })
  })
})

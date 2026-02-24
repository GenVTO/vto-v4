import type { TryOnProvider } from '@vto/types'

import { createSqliteDbGateway } from '@vto/db'
import { createInDiskStorageGateway } from '@vto/storage'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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

function failingProviderMock(): TryOnProvider {
  return {
    status() {
      return Promise.resolve({ status: 'failed' })
    },
    submit() {
      return Promise.reject(new Error('forced failure'))
    },
  }
}

async function createTestGateways() {
  const testId = crypto.randomUUID()
  const baseDir = join(tmpdir(), 'vto-tryon-tests', testId)
  const migrationDir = new URL('../../sqlite-db/migrations/', import.meta.url)
  await mkdir(baseDir, { recursive: true })

  const db = createSqliteDbGateway({
    migrationDir: migrationDir.pathname,
    seedTenants: [
      {
        apiKey: 'k1',
        credits: 2,
        shopDomain: 'demo-shop.myshopify.com',
        tenantId: 'tenant_1',
      },
    ],
    url: `file:${join(baseDir, 'db.sqlite')}`,
  })
  const storage = createInDiskStorageGateway({
    baseDir: join(baseDir, 'storage'),
  })

  return { db, storage }
}

describe(createTryOnGateway, () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/jpeg' },
          status: 200,
        }),
    ) as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('creates a job and charges one credit after provider accepts', async () => {
    const { db, storage } = await createTestGateways()

    const gateway = createTryOnGateway({
      db,
      modelProviderMap: { advanced: 'fashn', normal: 'fashn' },
      providers: { fashn: providerMock() },
      storage,
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
    expect(twice?.result_url).toContain('file://')
  })

  it('returns cache hit without charging credits', async () => {
    const { db, storage } = await createTestGateways()

    const gateway = createTryOnGateway({
      db,
      modelProviderMap: { advanced: 'fashn', normal: 'fashn' },
      providers: { fashn: providerMock() },
      storage,
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

  it('falls back to next provider when first provider submit fails', async () => {
    const { db, storage } = await createTestGateways()

    const gateway = createTryOnGateway({
      db,
      modelProviderOrderMap: { advanced: ['vertex', 'fashn'], normal: ['vertex', 'fashn'] },
      providers: {
        fashn: providerMock(),
        vertex: failingProviderMock(),
      },
      storage,
    })

    const created = await gateway.runTryOn(
      {
        model: 'advanced',
        product_id: 'p-fallback',
        product_image_url: 'https://cdn.example.com/p.jpg',
        shop_domain: 'demo-shop.myshopify.com',
        user_image_url: 'https://cdn.example.com/u.jpg',
        visitor_id: 'visitor_fallback',
      },
      { shopDomain: 'demo-shop.myshopify.com', tenantId: 'tenant_1' },
    )

    expect(created.credits_charged).toBe(1)
    expect(created.status).toBe('processing')

    const job = await db.getJob(created.job_id)
    expect(job?.provider_job_id?.startsWith('fashn::')).toBeTruthy()
  })

  it('refunds reserved credit when provider submit fails before acceptance', async () => {
    const { db, storage } = await createTestGateways()

    const gateway = createTryOnGateway({
      db,
      modelProviderMap: { advanced: 'vertex', normal: 'vertex' },
      providers: {
        vertex: failingProviderMock(),
      },
      storage,
    })

    await expect(
      gateway.runTryOn(
        {
          model: 'advanced',
          product_id: 'p-refund',
          product_image_url: 'https://cdn.example.com/p.jpg',
          shop_domain: 'demo-shop.myshopify.com',
          user_image_url: 'https://cdn.example.com/u.jpg',
          visitor_id: 'visitor_refund',
        },
        { shopDomain: 'demo-shop.myshopify.com', tenantId: 'tenant_1' },
      ),
    ).rejects.toThrow('No provider available for model.')

    await expect(db.getCreditBalance('tenant_1')).resolves.toBe(2)
  })
})

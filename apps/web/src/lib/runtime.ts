import { createInMemoryDbGateway } from '@vto/db'
import { FashnTryOnProvider, MockFashnClient } from '@vto/fashn'
import { createTryOnGateway } from '@vto/try-on'

const defaultApiKey = 'dev_vto_api_key'
const defaultShopDomain = 'demo-shop.myshopify.com'

const db = createInMemoryDbGateway({
  seedTenants: [
    {
      apiKey: defaultApiKey,
      credits: 1000,
      shopDomain: defaultShopDomain,
      tenantId: 'tenant_demo',
    },
  ],
})

const fashnProvider = new FashnTryOnProvider(
  new MockFashnClient({
    failRate: 0.15,
    maxDelayMs: 12_000,
    minDelayMs: 4000,
  }),
)

const tryOnGateway = createTryOnGateway({
  db,
  modelProviderMap: {
    advanced: 'fashn',
    normal: 'fashn',
  },
  providers: {
    fashn: fashnProvider,
  },
})

export const runtime = {
  db,
  defaults: {
    apiKey: defaultApiKey,
    shopDomain: defaultShopDomain,
  },
  tryOnGateway,
}

import type { DbGateway } from '@vto/db/contracts'
import type { CreateTryOnRequest, CreateTryOnResponse, TryOnJob, TryOnModel } from '@vto/types'

import type {
  CreateTryOnGatewayOptions,
  RunTryOnContext,
  TryOnGateway,
  TryOnProvider,
  TryOnProviderSubmitResult,
} from './contracts'

import { TryOnGatewayError } from './error'
import { getPersonImageRef, polledJobStatus, providerByName, sha256Hex } from './helpers'

const DEFAULT_HISTORY_LIMIT = 10
const DEFAULT_HISTORY_OFFSET = 0

interface CachedLookupInput {
  db: DbGateway
  context: RunTryOnContext
  input: CreateTryOnRequest
  userImageHash: string
}

interface ProviderSubmitContext {
  db: DbGateway
  input: CreateTryOnRequest
  context: RunTryOnContext
  userImageHash: string
  modelProviderMap: Record<TryOnModel, string>
  providers: Record<string, TryOnProvider>
}

function assertTenantShopMatch(inputShopDomain: string, contextShopDomain: string): void {
  if (inputShopDomain !== contextShopDomain) {
    throw new TryOnGatewayError('UNAUTHORIZED', 'shop_domain does not match authenticated tenant.')
  }
}

async function idempotentResponse(input: CachedLookupInput): Promise<CreateTryOnResponse | null> {
  const key = input.input.idempotency_key
  if (!key) {
    return null
  }

  const existing = await input.db.findJobByIdempotency(input.context.tenantId, key)
  if (!existing) {
    return null
  }

  return {
    cache_hit: existing.status === 'completed',
    credits_charged: 0,
    job_id: existing.id,
    result_url: existing.result_url,
    status: existing.status,
  }
}

async function cachedResponse(input: CachedLookupInput): Promise<CreateTryOnResponse | null> {
  const cached = await input.db.findCachedResult({
    productId: input.input.product_id,
    shopDomain: input.input.shop_domain,
    userImageHash: input.userImageHash,
  })

  if (!cached) {
    return null
  }

  if (input.input.idempotency_key) {
    await input.db.saveJobIdempotency(
      input.context.tenantId,
      input.input.idempotency_key,
      cached.id,
    )
  }

  return {
    cache_hit: true,
    credits_charged: 0,
    job_id: cached.id,
    result_url: cached.result_url,
    status: 'completed',
  }
}

async function cachedOrIdempotentJob(
  input: CachedLookupInput,
): Promise<CreateTryOnResponse | null> {
  const idempotent = await idempotentResponse(input)
  if (idempotent) {
    return idempotent
  }

  return cachedResponse(input)
}

async function createProviderJob(
  input: ProviderSubmitContext,
): Promise<{ job: TryOnJob; submitResult: TryOnProviderSubmitResult }> {
  const model = input.input.model ?? 'advanced'
  const providerName = input.modelProviderMap[model]
  const provider = providerByName(input.providers, providerName)

  const job = await input.db.createJob({
    ...input.input,
    model,
    tenantId: input.context.tenantId,
    userImageHash: input.userImageHash,
  })

  if (!provider) {
    await input.db.updateJobStatus({
      errorCode: 'PROVIDER_FAILED',
      errorMessage: `Provider not configured for model ${model}.`,
      jobId: job.id,
      status: 'failed',
    })

    throw new TryOnGatewayError('PROVIDER_FAILED', 'No provider configured for model.', { model })
  }

  const submitResult = await provider.submit({
    model,
    params: input.input.metadata,
    personImageUrl: getPersonImageRef(input.input),
    productImageUrl: input.input.product_image_url,
  })

  return { job, submitResult }
}

async function submitAndCharge(input: ProviderSubmitContext): Promise<CreateTryOnResponse> {
  const hasCredits = await input.db.hasCredits(input.context.tenantId)
  if (!hasCredits) {
    throw new TryOnGatewayError('INSUFFICIENT_CREDITS', 'No credits available for this tenant.')
  }

  const { job, submitResult } = await createProviderJob(input)

  await input.db.reserveCredit(input.context.tenantId)
  await input.db.recordCreditEvent({
    amountCredits: -1,
    eventType: 'debit_tryon',
    metadata: {
      job_id: job.id,
      provider: submitResult.provider,
      provider_job_id: submitResult.providerJobId,
    },
    tenantId: input.context.tenantId,
  })

  await input.db.updateJobStatus({
    jobId: job.id,
    providerJobId: submitResult.providerJobId,
    status: 'processing',
  })

  if (input.input.idempotency_key) {
    await input.db.saveJobIdempotency(input.context.tenantId, input.input.idempotency_key, job.id)
  }

  return {
    cache_hit: false,
    credits_charged: 1,
    job_id: job.id,
    result_url: null,
    status: 'processing',
  }
}

export function createTryOnGateway(options: CreateTryOnGatewayOptions): TryOnGateway {
  const { db, modelProviderMap, providers } = options

  return {
    cancelJob(_jobId) {
      return Promise.resolve({ cancelled: false })
    },

    async getHistory(query, context) {
      assertTenantShopMatch(query.shop_domain, context.shopDomain)
      const limit = query.limit ?? DEFAULT_HISTORY_LIMIT
      const offset = query.offset ?? DEFAULT_HISTORY_OFFSET
      const { items, total } = await db.getHistory({ ...query, limit, offset })
      return { items, limit, offset, total }
    },

    async getJobStatus(jobId, context) {
      const job = await db.getJob(jobId)
      if (!job) {
        return null
      }

      assertTenantShopMatch(job.shop_domain, context.shopDomain)
      return polledJobStatus({ db, job, modelProviderMap, providers })
    },

    async runTryOn(input, context) {
      assertTenantShopMatch(input.shop_domain, context.shopDomain)

      const userImageHash = await sha256Hex(getPersonImageRef(input))
      const existingResult = await cachedOrIdempotentJob({
        context,
        db,
        input,
        userImageHash,
      })

      if (existingResult) {
        return existingResult
      }

      return submitAndCharge({
        context,
        db,
        input,
        modelProviderMap,
        providers,
        userImageHash,
      })
    },
  }
}

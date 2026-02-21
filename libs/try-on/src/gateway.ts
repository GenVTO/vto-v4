import type { DbGateway } from '@vto/db/contracts'
import type { CreateTryOnRequest, CreateTryOnResponse, TryOnJob, TryOnModel } from '@vto/types'

import { createLogger } from '@vto/logger'

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
const tryOnLogger = createLogger({ service: '@vto/try-on' })

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
    tryOnLogger.warn('Tenant/shop mismatch detected', {
      context_shop_domain: contextShopDomain,
      input_shop_domain: inputShopDomain,
    })
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
  tryOnLogger.info('Idempotency hit', {
    job_id: existing.id,
    tenant_id: input.context.tenantId,
  })

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
  tryOnLogger.info('Cache hit for try-on result', {
    job_id: cached.id,
    product_id: input.input.product_id,
    shop_domain: input.input.shop_domain,
  })

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
  tryOnLogger.debug('Creating provider job', {
    model,
    provider: providerName,
    shop_domain: input.input.shop_domain,
    tenant_id: input.context.tenantId,
  })

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
  tryOnLogger.info('Provider job submitted', {
    job_id: job.id,
    provider: submitResult.provider,
    provider_job_id: submitResult.providerJobId,
  })

  return { job, submitResult }
}

async function submitAndCharge(input: ProviderSubmitContext): Promise<CreateTryOnResponse> {
  const hasCredits = await input.db.hasCredits(input.context.tenantId)
  if (!hasCredits) {
    tryOnLogger.warn('Try-on rejected due to insufficient credits', {
      tenant_id: input.context.tenantId,
    })
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
  tryOnLogger.info('Credit charged and job moved to processing', {
    job_id: job.id,
    tenant_id: input.context.tenantId,
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
  tryOnLogger.info('Try-on gateway initialized', {
    models: Object.keys(modelProviderMap),
    providers: Object.keys(providers),
  })

  return {
    cancelJob(_jobId) {
      return Promise.resolve({ cancelled: false })
    },

    async getHistory(query, context) {
      assertTenantShopMatch(query.shop_domain, context.shopDomain)
      const limit = query.limit ?? DEFAULT_HISTORY_LIMIT
      const offset = query.offset ?? DEFAULT_HISTORY_OFFSET
      const { items, total } = await db.getHistory({ ...query, limit, offset })
      tryOnLogger.debug('History fetched', {
        limit,
        offset,
        shop_domain: query.shop_domain,
        tenant_id: context.tenantId,
        total,
      })
      return { items, limit, offset, total }
    },

    async getJobStatus(jobId, context) {
      const job = await db.getJob(jobId)
      if (!job) {
        tryOnLogger.warn('Job status requested for missing job', { job_id: jobId })
        return null
      }

      assertTenantShopMatch(job.shop_domain, context.shopDomain)
      tryOnLogger.debug('Polling provider status for job', {
        job_id: job.id,
        provider_job_id: job.provider_job_id,
        status: job.status,
      })
      return polledJobStatus({ db, job, modelProviderMap, providers })
    },

    async runTryOn(input, context) {
      assertTenantShopMatch(input.shop_domain, context.shopDomain)
      tryOnLogger.info('Run try-on requested', {
        model: input.model ?? 'advanced',
        product_id: input.product_id,
        shop_domain: input.shop_domain,
        tenant_id: context.tenantId,
        visitor_id: input.visitor_id,
      })

      const userImageHash = await sha256Hex(getPersonImageRef(input))
      const existingResult = await cachedOrIdempotentJob({
        context,
        db,
        input,
        userImageHash,
      })

      if (existingResult) {
        tryOnLogger.info('Returning cached/idempotent try-on result', {
          credits_charged: existingResult.credits_charged,
          job_id: existingResult.job_id,
          status: existingResult.status,
        })
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

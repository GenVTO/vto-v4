import type {
  CreateTryOnRequest,
  CreateTryOnResponse,
  DbGateway,
  StorageGateway,
  TryOnJobEventType,
  TryOnJob,
  TryOnModel,
  TryOnProvider,
  TryOnProviderSubmitResult,
} from '@vto/types'

import { createLogger } from '@vto/logger'

import type { CreateTryOnGatewayOptions, RunTryOnContext, TryOnGateway } from './contracts'

import { TryOnGatewayError } from './error'
import {
  decodeProviderJobRef,
  encodeProviderJobRef,
  getPersonImageRef,
  polledJobStatus,
  providerByName,
  sha256Hex,
} from './helpers'

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
  storage: StorageGateway
  job: TryOnJob
  input: CreateTryOnRequest
  context: RunTryOnContext
  modelProviderMap?: Record<TryOnModel, string>
  modelProviderOrderMap?: Partial<Record<TryOnModel, string[]>>
  providers: Record<string, TryOnProvider>
}

interface InternalTryOnMetadata {
  api_request_received_at?: string
  image_upload_completed_at?: string
  product_image_key?: string
  user_image_key?: string
}

function extractInternalMetadata(metadata: CreateTryOnRequest['metadata']): InternalTryOnMetadata {
  const internal = metadata?.__vto_internal
  if (!internal || typeof internal !== 'object' || Array.isArray(internal)) {
    return {}
  }

  return internal as InternalTryOnMetadata
}

function toProviderParams(
  metadata: CreateTryOnRequest['metadata'],
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined
  }

  const { __vto_internal, ...providerParams } = metadata
  return Object.keys(providerParams).length > 0 ? providerParams : undefined
}

async function recordJobEventSafe(input: {
  db: DbGateway
  tenantId: string
  jobId: string
  eventType: TryOnJobEventType
  metadata?: Record<string, unknown>
  occurredAt?: string
}): Promise<void> {
  try {
    await input.db.recordJobEvent({
      eventType: input.eventType,
      jobId: input.jobId,
      metadata: input.metadata,
      occurredAt: input.occurredAt,
      tenantId: input.tenantId,
    })
  } catch (error) {
    tryOnLogger.warn('Failed to record try-on job event', {
      error: error instanceof Error ? error.message : String(error),
      event_type: input.eventType,
      job_id: input.jobId,
      tenant_id: input.tenantId,
    })
  }
}

function resolveProviderOrder(
  model: TryOnModel,
  providers: Record<string, TryOnProvider>,
  modelProviderMap: ProviderSubmitContext['modelProviderMap'],
  modelProviderOrderMap: ProviderSubmitContext['modelProviderOrderMap'],
): string[] {
  const explicitOrder = modelProviderOrderMap?.[model] ?? []
  const mappedProvider = modelProviderMap?.[model]
  const baseOrder = [...explicitOrder, ...(mappedProvider ? [mappedProvider] : [])]

  if (baseOrder.length > 0) {
    return [...new Set(baseOrder)]
  }

  return Object.keys(providers)
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

async function createProviderJob(input: ProviderSubmitContext): Promise<TryOnProviderSubmitResult> {
  const model = input.input.model ?? 'advanced'
  const providerOrder = resolveProviderOrder(
    model,
    input.providers,
    input.modelProviderMap,
    input.modelProviderOrderMap,
  )
  tryOnLogger.debug('Creating provider job', {
    model,
    providers: providerOrder,
    shop_domain: input.input.shop_domain,
    tenant_id: input.context.tenantId,
  })

  const submitErrors: string[] = []
  for (const providerName of providerOrder) {
    const provider = providerByName(input.providers, providerName)
    if (!provider) {
      submitErrors.push(`Provider ${providerName} not configured`)
      continue
    }

    try {
      const providerPayload = {
        model,
        params: toProviderParams(input.input.metadata),
        personImageUrl: getPersonImageRef(input.input),
        productImageUrl: input.input.product_image_url,
      }
      await recordJobEventSafe({
        db: input.db,
        eventType: 'provider_submit_started',
        jobId: input.job.id,
        metadata: {
          model,
          provider: providerName,
        },
        tenantId: input.context.tenantId,
      })
      tryOnLogger.info('Submitting provider request', {
        job_id: input.job.id,
        provider: providerName,
        request: providerPayload,
      })
      const submitResult = await provider.submit({
        model: providerPayload.model,
        params: providerPayload.params,
        personImageUrl: providerPayload.personImageUrl,
        productImageUrl: providerPayload.productImageUrl,
      })
      tryOnLogger.info('Provider job submitted', {
        job_id: input.job.id,
        provider: submitResult.provider,
        provider_job_id: submitResult.providerJobId,
        response: submitResult,
      })
      await recordJobEventSafe({
        db: input.db,
        eventType: 'provider_submit_succeeded',
        jobId: input.job.id,
        metadata: {
          provider: submitResult.provider,
          provider_job_id: submitResult.providerJobId,
        },
        occurredAt: submitResult.acceptedAt,
        tenantId: input.context.tenantId,
      })
      return submitResult
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      submitErrors.push(`${providerName}: ${message}`)
      await recordJobEventSafe({
        db: input.db,
        eventType: 'provider_submit_failed',
        jobId: input.job.id,
        metadata: {
          error: message,
          provider: providerName,
        },
        tenantId: input.context.tenantId,
      })
      tryOnLogger.warn('Provider submit failed, trying next provider', {
        error: message,
        job_id: input.job.id,
        provider: providerName,
      })
    }
  }

  await input.db.updateJobStatus({
    errorCode: 'PROVIDER_FAILED',
    errorMessage: submitErrors.join(' | ') || `Provider not configured for model ${model}.`,
    jobId: input.job.id,
    status: 'failed',
  })

  throw new TryOnGatewayError('PROVIDER_FAILED', 'No provider available for model.', {
    model,
    providers: providerOrder,
  })
}

async function submitAndCharge(input: ProviderSubmitContext): Promise<CreateTryOnResponse> {
  const creditSnapshot = await input.db.getCreditSnapshot(input.context.tenantId)
  if (creditSnapshot.availableCredits <= 0) {
    tryOnLogger.warn('Try-on rejected due to insufficient credits', {
      available_credits: creditSnapshot.availableCredits,
      in_flight_reserved_count: creditSnapshot.inFlightReservedCount,
      tenant_id: input.context.tenantId,
    })
    throw new TryOnGatewayError('INSUFFICIENT_CREDITS', 'No credits available for this tenant.', {
      available_credits: creditSnapshot.availableCredits,
      in_flight_reserved_count: creditSnapshot.inFlightReservedCount,
    })
  }

  try {
    await input.db.reserveCreditForJob(input.context.tenantId, input.job.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('no credits')) {
      const latestSnapshot = await input.db.getCreditSnapshot(input.context.tenantId)
      tryOnLogger.warn('Try-on rejected while reserving credit', {
        available_credits: latestSnapshot.availableCredits,
        tenant_id: input.context.tenantId,
      })
      throw new TryOnGatewayError('INSUFFICIENT_CREDITS', 'No credits available for this tenant.', {
        available_credits: latestSnapshot.availableCredits,
      })
    }
    throw error
  }
  tryOnLogger.info('Credit reserved for try-on attempt', {
    tenant_id: input.context.tenantId,
  })

  let submitResult: TryOnProviderSubmitResult

  try {
    submitResult = await createProviderJob(input)
  } catch (error) {
    await input.db.recordCreditEvent({
      amountCredits: 1,
      eventType: 'refund',
      metadata: {
        job_id: input.job.id,
        reason: 'provider_submit_failed_before_accept',
      },
      tenantId: input.context.tenantId,
    })
    tryOnLogger.warn('Credit refunded after provider submit failure', {
      tenant_id: input.context.tenantId,
    })
    throw error
  }

  await input.db.updateJobStatus({
    jobId: input.job.id,
    providerJobId: encodeProviderJobRef(submitResult.provider, submitResult.providerJobId),
    status: 'processing',
  })
  tryOnLogger.info('Credit charged and job moved to processing', {
    job_id: input.job.id,
    tenant_id: input.context.tenantId,
  })

  if (input.input.idempotency_key) {
    await input.db.saveJobIdempotency(
      input.context.tenantId,
      input.input.idempotency_key,
      input.job.id,
    )
  }

  return {
    cache_hit: false,
    credits_charged: 1,
    job_id: input.job.id,
    result_url: null,
    status: 'processing',
  }
}

export function createTryOnGateway(options: CreateTryOnGatewayOptions): TryOnGateway {
  const { db, modelProviderMap, modelProviderOrderMap, providers, storage } = options
  tryOnLogger.info('Try-on gateway initialized', {
    models: Object.keys(modelProviderMap ?? modelProviderOrderMap ?? {}),
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
      const providerRef = decodeProviderJobRef(job.provider_job_id)
      const resolved = await polledJobStatus({
        db,
        job: {
          ...job,
          provider_job_id: providerRef.providerJobId || null,
        },
        modelProviderMap,
        modelProviderOrderMap,
        providers,
        selectedProviderName: providerRef.providerName,
        storage,
        tenantId: context.tenantId,
      })
      if (resolved) {
        await recordJobEventSafe({
          db,
          eventType: 'job_status_updated',
          jobId: resolved.id,
          metadata: { status: resolved.status },
          tenantId: context.tenantId,
        })
        if (resolved.status === 'completed' && resolved.result_url) {
          await recordJobEventSafe({
            db,
            eventType: 'result_delivered_to_client',
            jobId: resolved.id,
            metadata: { result_url: resolved.result_url },
            tenantId: context.tenantId,
          })
        }
      }
      return resolved
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

      const job = await db.createJob({
        ...input,
        model: input.model ?? 'advanced',
        tenantId: context.tenantId,
        userImageHash,
      })
      const internalMetadata = extractInternalMetadata(input.metadata)
      await recordJobEventSafe({
        db,
        eventType: 'api_request_received',
        jobId: job.id,
        occurredAt: internalMetadata.api_request_received_at,
        tenantId: context.tenantId,
      })
      if (internalMetadata.image_upload_completed_at) {
        await recordJobEventSafe({
          db,
          eventType: 'input_images_uploaded',
          jobId: job.id,
          metadata: {
            product_image_key: internalMetadata.product_image_key ?? null,
            user_image_key: internalMetadata.user_image_key ?? null,
          },
          occurredAt: internalMetadata.image_upload_completed_at,
          tenantId: context.tenantId,
        })
      }

      return submitAndCharge({
        context,
        db,
        input,
        job,
        modelProviderMap,
        modelProviderOrderMap,
        providers,
        storage,
      })
    },
  }
}

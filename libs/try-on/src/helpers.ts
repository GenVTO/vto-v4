import type {
  CreateTryOnRequest,
  DbGateway,
  StorageGateway,
  TryOnJob,
  TryOnJobEventType,
  TryOnModel,
  TryOnProvider,
  TryOnProviderStatusResult,
} from '@vto/types'

import { createLogger } from '@vto/logger'

const HEX_BASE = 16
const HEX_PAD = 2
const helpersLogger = createLogger({ service: '@vto/try-on-helpers' })

const PROVIDER_JOB_SEPARATOR = '::'

async function recordJobEventSafe(input: {
  db: DbGateway
  tenantId: string
  jobId: string
  eventType: TryOnJobEventType
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await input.db.recordJobEvent({
      eventType: input.eventType,
      jobId: input.jobId,
      metadata: input.metadata,
      tenantId: input.tenantId,
    })
  } catch (error) {
    helpersLogger.warn('Failed to record try-on job event', {
      error: error instanceof Error ? error.message : String(error),
      event_type: input.eventType,
      job_id: input.jobId,
      tenant_id: input.tenantId,
    })
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return [...new Uint8Array(digest)]
    .map((byteValue) => byteValue.toString(HEX_BASE).padStart(HEX_PAD, '0'))
    .join('')
}

export function getPersonImageRef(input: CreateTryOnRequest): string {
  const personImageRef = input.user_image_url ?? input.user_image
  if (!personImageRef) {
    throw new Error('Missing user image reference.')
  }
  return personImageRef
}

export function isTerminalStatus(status: TryOnJob['status']): boolean {
  return status === 'completed' || status === 'failed' || status === 'provider_expired'
}

export function providerByName(
  providers: Record<string, TryOnProvider>,
  providerName: string,
): TryOnProvider | null {
  return providers[providerName] ?? null
}

export function encodeProviderJobRef(providerName: string, providerJobId: string): string {
  return `${providerName}${PROVIDER_JOB_SEPARATOR}${providerJobId}`
}

export function decodeProviderJobRef(value: string | null | undefined): {
  providerJobId: string
  providerName: string | null
} {
  if (!value) {
    return { providerJobId: '', providerName: null }
  }

  const separatorIndex = value.indexOf(PROVIDER_JOB_SEPARATOR)
  if (separatorIndex === -1) {
    return { providerJobId: value, providerName: null }
  }

  return {
    providerJobId: value.slice(separatorIndex + PROVIDER_JOB_SEPARATOR.length),
    providerName: value.slice(0, separatorIndex) || null,
  }
}

export interface UpdateFromProviderStatusInput {
  db: DbGateway
  job: TryOnJob
  tenantId: string
  providerName: string | null
  providerStatus: TryOnProviderStatusResult
  storage: StorageGateway
}

export async function updateFromProviderStatus(
  input: UpdateFromProviderStatusInput,
): Promise<void> {
  const { db, job, providerName, providerStatus, storage } = input
  helpersLogger.debug('Applying provider status update', {
    job_id: job.id,
    provider: providerName ?? 'unknown',
    provider_job_id: job.provider_job_id,
    provider_result_url: providerStatus.resultUrl ?? null,
    provider_status: providerStatus.status,
  })
  if (providerStatus.status === 'completed') {
    if (!providerStatus.resultUrl) {
      await db.updateJobStatus({
        errorCode: 'PROVIDER_FAILED',
        errorMessage: 'Provider completed without result URL.',
        jobId: job.id,
        status: 'failed',
      })
      return
    }

    try {
      await recordJobEventSafe({
        db,
        eventType: 'provider_result_persist_started',
        jobId: job.id,
        metadata: {
          provider: providerName ?? 'unknown',
          provider_result_url: providerStatus.resultUrl,
        },
        tenantId: input.tenantId,
      })
      const persistedResult = await storage.persistTryOnResult({
        createdAt: job.created_at,
        jobId: job.id,
        providerName,
        providerResultUrl: providerStatus.resultUrl,
        shopDomain: job.shop_domain,
        updatedAt: job.updated_at,
      })
      helpersLogger.info('Stored provider result using storage gateway', {
        content_type: persistedResult.contentType,
        job_id: job.id,
        key: persistedResult.key,
        provider: providerName ?? 'unknown',
        size_bytes: persistedResult.sizeBytes,
        stored_result_url: persistedResult.resultUrl,
      })
      await db.updateJobStatus({
        jobId: job.id,
        resultUrl: persistedResult.resultUrl,
        status: 'completed',
      })
      await recordJobEventSafe({
        db,
        eventType: 'provider_result_persisted',
        jobId: job.id,
        metadata: {
          key: persistedResult.key,
          provider: providerName ?? 'unknown',
          result_url: persistedResult.resultUrl,
          size_bytes: persistedResult.sizeBytes,
        },
        tenantId: input.tenantId,
      })
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      helpersLogger.error('Failed storing provider result in platform storage', {
        error: message,
        job_id: job.id,
        provider: providerName ?? 'unknown',
      })
      await db.updateJobStatus({
        errorCode: 'STORAGE_FAILED',
        errorMessage: message,
        jobId: job.id,
        status: 'failed',
      })
      await recordJobEventSafe({
        db,
        eventType: 'provider_result_persist_failed',
        jobId: job.id,
        metadata: {
          error: message,
          provider: providerName ?? 'unknown',
        },
        tenantId: input.tenantId,
      })
      return
    }
  }

  if (providerStatus.status === 'failed') {
    await db.updateJobStatus({
      errorCode: 'PROVIDER_FAILED',
      errorMessage: providerStatus.error ?? 'Provider returned failed status.',
      jobId: job.id,
      status: 'failed',
    })
    return
  }

  if (providerStatus.status === 'provider_expired') {
    await db.updateJobStatus({
      errorCode: 'PROVIDER_TIMEOUT',
      errorMessage: providerStatus.error ?? 'Provider job expired.',
      jobId: job.id,
      status: 'provider_expired',
    })
    return
  }

  await db.updateJobStatus({
    jobId: job.id,
    status: providerStatus.status,
  })
}

interface PolledJobStatusInput {
  db: DbGateway
  tenantId: string
  storage: StorageGateway
  providers: Record<string, TryOnProvider>
  modelProviderMap?: Record<TryOnModel, string>
  modelProviderOrderMap?: Partial<Record<TryOnModel, string[]>>
  selectedProviderName?: string | null
  job: TryOnJob
}

function resolvePollingProviderName(input: PolledJobStatusInput): string | null {
  if (input.selectedProviderName) {
    return input.selectedProviderName
  }

  const explicit = input.modelProviderOrderMap?.[input.job.model]?.[0]
  if (explicit) {
    return explicit
  }

  const mapped = input.modelProviderMap?.[input.job.model]
  if (mapped) {
    return mapped
  }

  return Object.keys(input.providers)[0] ?? null
}

async function failMissingProvider(db: DbGateway, job: TryOnJob): Promise<TryOnJob | null> {
  helpersLogger.warn('Missing provider while polling status', {
    job_id: job.id,
    model: job.model,
  })
  await db.updateJobStatus({
    errorCode: 'PROVIDER_FAILED',
    errorMessage: 'Provider not configured during status polling.',
    jobId: job.id,
    status: 'failed',
  })

  return db.getJob(job.id)
}

export async function polledJobStatus(input: PolledJobStatusInput): Promise<TryOnJob | null> {
  const { db, job, providers, storage, tenantId } = input

  if (isTerminalStatus(job.status) || !job.provider_job_id) {
    helpersLogger.debug('Skipping polling for terminal or unsubmitted job', {
      job_id: job.id,
      provider_job_id: job.provider_job_id,
      status: job.status,
    })
    return job
  }

  const providerName = resolvePollingProviderName(input)
  if (!providerName) {
    return failMissingProvider(db, job)
  }

  const provider = providerByName(providers, providerName)

  if (!provider) {
    return failMissingProvider(db, job)
  }

  helpersLogger.info('Polling external provider status', {
    job_id: job.id,
    provider: providerName,
    provider_job_id: job.provider_job_id,
  })
  await recordJobEventSafe({
    db,
    eventType: 'provider_poll_started',
    jobId: job.id,
    metadata: {
      provider: providerName,
      provider_job_id: job.provider_job_id,
    },
    tenantId,
  })
  const providerStatus = await provider.status(job.provider_job_id)
  helpersLogger.info('External provider polling response received', {
    job_id: job.id,
    provider: providerName,
    provider_error: providerStatus.error ?? null,
    provider_result_url: providerStatus.resultUrl ?? null,
    provider_status: providerStatus.status,
  })
  await updateFromProviderStatus({
    db,
    job,
    providerName,
    providerStatus,
    storage,
    tenantId,
  })
  await recordJobEventSafe({
    db,
    eventType: 'provider_poll_completed',
    jobId: job.id,
    metadata: {
      provider: providerName,
      provider_status: providerStatus.status,
    },
    tenantId,
  })

  return db.getJob(job.id)
}

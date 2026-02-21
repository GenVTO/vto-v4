import type { DbGateway } from '@vto/db/contracts'
import type { CreateTryOnRequest, TryOnJob, TryOnModel } from '@vto/types'

import type { TryOnProvider, TryOnProviderStatusResult } from './contracts'

const HEX_BASE = 16
const HEX_PAD = 2

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

export async function updateFromProviderStatus(
  db: DbGateway,
  job: TryOnJob,
  providerStatus: TryOnProviderStatusResult,
): Promise<void> {
  if (providerStatus.status === 'completed') {
    await db.updateJobStatus({
      jobId: job.id,
      resultUrl: providerStatus.resultUrl,
      status: 'completed',
    })
    return
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
  providers: Record<string, TryOnProvider>
  modelProviderMap: Record<TryOnModel, string>
  job: TryOnJob
}

async function failMissingProvider(db: DbGateway, job: TryOnJob): Promise<TryOnJob | null> {
  await db.updateJobStatus({
    errorCode: 'PROVIDER_FAILED',
    errorMessage: 'Provider not configured during status polling.',
    jobId: job.id,
    status: 'failed',
  })

  return db.getJob(job.id)
}

export async function polledJobStatus(input: PolledJobStatusInput): Promise<TryOnJob | null> {
  const { db, job, modelProviderMap, providers } = input

  if (isTerminalStatus(job.status) || !job.provider_job_id) {
    return job
  }

  const provider = providerByName(providers, modelProviderMap[job.model])

  if (!provider) {
    return failMissingProvider(db, job)
  }

  const providerStatus = await provider.status(job.provider_job_id)
  await updateFromProviderStatus(db, job, providerStatus)

  return db.getJob(job.id)
}

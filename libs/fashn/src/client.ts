import type { TryOnProviderStatusResult } from '@vto/types'

import { parseFashnEnv } from '@vto/env/fashn'
import { createLogger } from '@vto/logger'
import { RequestError, createRequestClient } from '@vto/request'

import type { FashnClient, FashnClientEnvOptions, FashnClientOptions } from './contracts'
import type { FashnStatusResponse } from './schemas'

import { toFashnModelName } from './model'
import { fashnRunResponseSchema, fashnStatusResponseSchema } from './schemas'

type JsonRecord = Record<string, unknown>

const DEFAULT_BASE_URL = 'https://api.fashn.ai'
const DEFAULT_TIMEOUT_MS = 120_000
const clientLogger = createLogger({ service: '@vto/fashn-client' })

function asRecord(input: unknown): JsonRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  return input as JsonRecord
}

function pickString(input: JsonRecord, key: string): string | undefined {
  const value = input[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function pickNumber(input: JsonRecord, key: string): number | undefined {
  const value = input[key]
  return typeof value === 'number' ? value : undefined
}

function pickBoolean(input: JsonRecord, key: string): boolean | undefined {
  const value = input[key]
  return typeof value === 'boolean' ? value : undefined
}

function resolveErrorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error
  }

  const record = asRecord(error)
  return pickString(record, 'message') ?? pickString(record, 'error')
}

function resolveOutputUrl(output: unknown): string | undefined {
  if (typeof output === 'string') {
    return output
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const result = resolveOutputUrl(item)
      if (result) {
        return result
      }
    }
    return undefined
  }

  const record = asRecord(output)
  return (
    pickString(record, 'image_url') ??
    pickString(record, 'result_url') ??
    pickString(record, 'url') ??
    pickString(record, 'image')
  )
}

function mapStatusResponse(response: FashnStatusResponse): TryOnProviderStatusResult {
  const normalized = response.status ?? 'processing'

  if (normalized === 'completed' || normalized === 'success' || normalized === 'succeeded') {
    return {
      resultUrl: resolveOutputUrl(response.output),
      status: 'completed',
    }
  }

  if (normalized === 'failed' || normalized === 'error') {
    return {
      error: resolveErrorMessage(response.error) ?? 'Fashn returned failed status.',
      status: 'failed',
    }
  }

  if (normalized === 'expired' || normalized === 'not_found') {
    return {
      error: resolveErrorMessage(response.error) ?? 'Fashn job expired.',
      status: 'provider_expired',
    }
  }

  if (
    normalized === 'starting' ||
    normalized === 'pending' ||
    normalized === 'in_queue' ||
    normalized === 'queued'
  ) {
    return { status: 'queued' }
  }

  return { status: 'processing' }
}

function toRunPayload(payload: Parameters<FashnClient['run']>[0]): JsonRecord {
  const params = asRecord(payload.params)

  if (payload.model === 'fashn-v1.6') {
    const inputs: JsonRecord = {
      garment_image: payload.productImageUrl,
      model_image: payload.personImageUrl,
    }

    const v16Keys = ['category', 'mode', 'output_format', 'garment_photo_type'] as const

    for (const key of v16Keys) {
      const value = pickString(params, key)
      if (value !== undefined) {
        inputs[key] = value
      }
    }

    const numSamples = pickNumber(params, 'num_samples')
    if (numSamples !== undefined) {
      inputs.num_samples = numSamples
    }

    const seed = pickNumber(params, 'seed')
    if (seed !== undefined) {
      inputs.seed = seed
    }

    const segmentationFree = pickBoolean(params, 'segmentation_free')
    if (segmentationFree !== undefined) {
      inputs.segmentation_free = segmentationFree
    }

    return {
      inputs,
      model_name: toFashnModelName(payload.model),
    }
  }

  const inputs: JsonRecord = {
    model_image: payload.personImageUrl,
    product_image: payload.productImageUrl,
  }

  const maxStringKeys = ['prompt', 'output_format'] as const
  for (const key of maxStringKeys) {
    const value = pickString(params, key)
    if (value !== undefined) {
      inputs[key] = value
    }
  }

  const maxNumberKeys = ['seed', 'num_images'] as const
  for (const key of maxNumberKeys) {
    const value = pickNumber(params, key)
    if (value !== undefined) {
      inputs[key] = value
    }
  }

  const returnBase64 = pickBoolean(params, 'return_base64')
  if (returnBase64 !== undefined) {
    inputs.return_base64 = returnBase64
  }

  return {
    inputs,
    model_name: toFashnModelName(payload.model),
  }
}

export class FashnApiClient implements FashnClient {
  private readonly requestClient: ReturnType<typeof createRequestClient>

  constructor(options: FashnClientOptions) {
    this.requestClient =
      options.requestClient ??
      createRequestClient({
        baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
        defaultHeaders: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
        retry: {
          delayTimer: 300,
          maxAttempts: 2,
        },
        timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      })
  }

  async run(payload: Parameters<FashnClient['run']>[0]): Promise<{ id: string }> {
    const runPayload = toRunPayload(payload)
    clientLogger.debug('Submitting Fashn run request', {
      model: payload.model,
    })

    const rawResponse = await this.requestClient.post<unknown>('/v1/run', {
      body: runPayload,
    })

    const parsed = fashnRunResponseSchema.safeParse(rawResponse)
    if (!parsed.success) {
      throw new RequestError({
        details: {
          issues: parsed.error.issues,
        },
        message: 'Fashn run response is invalid.',
        statusCode: null,
        statusName: null,
      })
    }

    return { id: parsed.data.id }
  }

  async status(jobId: string): Promise<TryOnProviderStatusResult> {
    try {
      const rawResponse = await this.requestClient.get<unknown>(`/v1/status/${jobId}`)
      const parsed = fashnStatusResponseSchema.safeParse(rawResponse)

      if (!parsed.success) {
        clientLogger.warn('Fashn status response is invalid', {
          issues: parsed.error.issues,
          job_id: jobId,
        })
        return {
          error: 'Invalid status response from Fashn.',
          status: 'failed',
        }
      }

      return mapStatusResponse(parsed.data)
    } catch (error) {
      if (error instanceof RequestError && error.statusName === 'HTTP_STATUS_NOT_FOUND') {
        return {
          error: 'Fashn job not found or expired.',
          status: 'provider_expired',
        }
      }

      throw error
    }
  }
}

export function createFashnClientFromEnv(options: FashnClientEnvOptions = {}): FashnApiClient {
  const env = parseFashnEnv(options.env)

  return new FashnApiClient({
    apiKey: env.FASHN_API_KEY,
    baseUrl: env.FASHN_BASE_URL,
    requestClient: options.requestClient,
    timeoutMs: env.FASHN_TIMEOUT_MS,
  })
}

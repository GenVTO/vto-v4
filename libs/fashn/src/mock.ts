import type { TryOnProviderStatusResult } from '@vto/try-on/contracts'

import type { FashnClient } from './contracts'

interface MockJob {
  createdAtMs: number
  readyAtMs: number
  fail: boolean
}

interface MockFashnClientOptions {
  minDelayMs?: number
  maxDelayMs?: number
  failRate?: number
}

const DEFAULT_MIN_DELAY_MS = 3000
const DEFAULT_MAX_DELAY_MS = 9000
const DEFAULT_FAIL_RATE = 0.1
const QUEUED_THRESHOLD_MS = 1500

export class MockFashnClient implements FashnClient {
  private readonly jobs = new Map<string, MockJob>()
  private readonly minDelayMs: number
  private readonly maxDelayMs: number
  private readonly failRate: number

  constructor(options: MockFashnClientOptions = {}) {
    this.minDelayMs = options.minDelayMs ?? DEFAULT_MIN_DELAY_MS
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
    this.failRate = options.failRate ?? DEFAULT_FAIL_RATE
  }

  run(_payload: {
    model: 'fashn-v1.6' | 'fashn-max'
    productImageUrl: string
    personImageUrl: string
    params?: Record<string, unknown>
  }): Promise<{ id: string }> {
    const id = `fashn_${crypto.randomUUID()}`
    const createdAtMs = Date.now()
    const delay =
      this.minDelayMs + Math.floor(Math.random() * (this.maxDelayMs - this.minDelayMs + 1))

    this.jobs.set(id, {
      createdAtMs,
      fail: Math.random() < this.failRate,
      readyAtMs: createdAtMs + delay,
    })

    return Promise.resolve({ id })
  }

  status(jobId: string): Promise<TryOnProviderStatusResult> {
    const job = this.jobs.get(jobId)
    if (!job) {
      return Promise.resolve({
        error: 'Provider job not found or expired.',
        status: 'provider_expired',
      })
    }

    const now = Date.now()
    if (now < job.readyAtMs) {
      const elapsed = now - job.createdAtMs
      return Promise.resolve({
        status: elapsed < QUEUED_THRESHOLD_MS ? 'queued' : 'processing',
      })
    }

    if (job.fail) {
      return Promise.resolve({
        error: 'Mocked provider failure.',
        status: 'failed',
      })
    }

    return Promise.resolve({
      resultUrl: `https://mock-cdn.example.com/tryon/${jobId}/result.jpg`,
      status: 'completed',
    })
  }
}

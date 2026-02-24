import type {
  PersistTryOnResultInput,
  PersistTryOnResultOutput,
  PutObjectInput,
  SignedUrlOptions,
  StorageGateway,
} from '@vto/types'

import { createLogger } from '@vto/logger'
// oxlint-disable-next-line import/no-nodejs-modules
import { mkdir, access, copyFile, rm, writeFile } from 'node:fs/promises'
// oxlint-disable-next-line import/no-nodejs-modules
import { dirname, join, normalize, resolve } from 'node:path'

import { buildTryOnResultKey, downloadProviderResult, toUint8Array } from './helpers'

const diskStorageLogger = createLogger({ service: '@vto/storage-disk' })

export interface InDiskStorageOptions {
  baseDir?: string
}

const DEFAULT_BASE_DIR = '.vto-storage'
const SECONDS_IN_MINUTE = 60
const MINUTES_IN_HOUR = 60
const HOURS_IN_DAY = 24
const DAYS_IN_MONTH = 30
const TRYON_RESULT_URL_TTL_SECONDS =
  SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH

function safeJoin(baseDir: string, key: string): string {
  const normalizedKey = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '')
  return resolve(join(baseDir, normalizedKey))
}

export class InDiskStorageGateway implements StorageGateway {
  private readonly baseDir: string

  constructor(options: InDiskStorageOptions = {}) {
    this.baseDir = resolve(options.baseDir ?? DEFAULT_BASE_DIR)
    diskStorageLogger.info('In-disk storage initialized', {
      base_dir: this.baseDir,
    })
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    const filePath = safeJoin(this.baseDir, input.key)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, await toUint8Array(input.body))
    diskStorageLogger.debug('In-disk object written', { key: input.key })
    return { key: input.key }
  }

  async getSignedUrl(key: string, _options: SignedUrlOptions): Promise<string> {
    const filePath = safeJoin(this.baseDir, key)
    return `file://${filePath}`
  }

  async exists(key: string): Promise<boolean> {
    const filePath = safeJoin(this.baseDir, key)
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const source = safeJoin(this.baseDir, sourceKey)
    const destination = safeJoin(this.baseDir, destinationKey)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(source, destination)
    diskStorageLogger.debug('In-disk object copied', {
      destination_key: destinationKey,
      source_key: sourceKey,
    })
  }

  async delete(key: string): Promise<void> {
    const filePath = safeJoin(this.baseDir, key)
    await rm(filePath, { force: true })
    diskStorageLogger.debug('In-disk object deleted', { key })
  }

  async persistTryOnResult(input: PersistTryOnResultInput): Promise<PersistTryOnResultOutput> {
    diskStorageLogger.info('Persisting try-on result in disk storage', {
      job_id: input.jobId,
      provider: input.providerName ?? 'unknown',
      source_url: input.providerResultUrl,
    })

    const { body, contentType } = await downloadProviderResult(input.providerResultUrl)
    const key = buildTryOnResultKey(input, contentType)

    await this.uploadResultToDisk({
      body,
      contentType,
      input,
      key,
    })

    const resultUrl = await this.getSignedUrl(key, {
      expiresInSeconds: TRYON_RESULT_URL_TTL_SECONDS,
    })
    return {
      contentType,
      key,
      resultUrl,
      sizeBytes: body.byteLength,
    }
  }

  private async uploadResultToDisk(params: {
    body: ArrayBuffer
    contentType: string
    input: PersistTryOnResultInput
    key: string
  }): Promise<void> {
    const { body, contentType, input, key } = params
    await this.put({
      body,
      contentType,
      key,
      metadata: {
        created_at: input.createdAt ?? '',
        job_id: input.jobId,
        provider: input.providerName ?? 'unknown',
        source: 'provider-result',
        updated_at: input.updatedAt ?? '',
        ...input.metadata,
      },
    })
  }
}

export function createInDiskStorageGateway(options?: InDiskStorageOptions): StorageGateway {
  return new InDiskStorageGateway(options)
}

import { createLogger } from '@vto/logger'
// oxlint-disable-next-line import/no-nodejs-modules
import { mkdir, access, copyFile, rm, writeFile } from 'node:fs/promises'
// oxlint-disable-next-line import/no-nodejs-modules
import { dirname, join, normalize, resolve } from 'node:path'

import type { PutObjectInput, SignedUrlOptions, StorageGateway } from './contracts'

const diskStorageLogger = createLogger({ service: '@vto/storage-disk' })

export interface InDiskStorageOptions {
  baseDir?: string
}

const DEFAULT_BASE_DIR = '.vto-storage'

function safeJoin(baseDir: string, key: string): string {
  const normalizedKey = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '')
  return resolve(join(baseDir, normalizedKey))
}

async function toUint8Array(body: PutObjectInput['body']): Promise<Uint8Array> {
  if (body instanceof Uint8Array) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
    const reader = body.getReader()
    const chunks: Uint8Array[] = []

    while (true) {
      const result = await reader.read()
      if (result.done) {
        break
      }
      chunks.push(result.value)
    }

    const total = chunks.reduce((size, chunk) => size + chunk.byteLength, 0)
    const merged = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.byteLength
    }
    return merged
  }

  return new Uint8Array()
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
}

export function createInDiskStorageGateway(options?: InDiskStorageOptions): StorageGateway {
  return new InDiskStorageGateway(options)
}

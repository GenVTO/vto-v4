import type { PutObjectCommandInput } from '@aws-sdk/client-s3'
import type { PersistTryOnResultInput, PutObjectInput } from '@vto/types'

import { S3Client } from '@aws-sdk/client-s3'

import type { S3StorageGatewayOptions } from './gateway'

const MAX_PATH_SEGMENT_LENGTH = 80
const HTTP_NOT_FOUND = 404
const DEFAULT_REGION = 'us-east-1'

export function toCopySource(bucket: string, key: string): string {
  const normalized = key.replace(/^\/+/, '')
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${bucket}/${encoded}`
}

async function collectStreamChunks(reader: ReadableStreamDefaultReader): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = []
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const result = await reader.read()
    if (result.done) {
      break
    }
    chunks.push(result.value)
  }
  return chunks
}

function mergeChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

async function readStreamToUint8Array(stream: ReadableStream): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks = await collectStreamChunks(reader)
  return mergeChunks(chunks)
}

export async function bodyToS3Body(
  body: PutObjectInput['body'],
): Promise<PutObjectCommandInput['Body']> {
  if (body instanceof Uint8Array) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
    return readStreamToUint8Array(body)
  }

  return body
}

export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    $metadata?: { httpStatusCode?: unknown }
    name?: unknown
  }

  if (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchKey' ||
    candidate.name === 'NoSuchBucket'
  ) {
    return true
  }

  return candidate.$metadata?.httpStatusCode === HTTP_NOT_FOUND
}

export function normalizePublicUrl(base: string, key: string): string {
  const baseUrl = base.endsWith('/') ? base : `${base}/`
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key
  return new URL(normalizedKey, baseUrl).toString()
}

function sanitizeStoragePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, MAX_PATH_SEGMENT_LENGTH)
}

function extensionFromContentType(contentType: string): string {
  const normalized = contentType.toLowerCase()
  if (normalized.includes('png')) {
    return 'png'
  }
  if (normalized.includes('webp')) {
    return 'webp'
  }
  if (normalized.includes('gif')) {
    return 'gif'
  }
  if (normalized.includes('avif')) {
    return 'avif'
  }
  return 'jpg'
}

export function buildTryOnResultKey(input: PersistTryOnResultInput, contentType: string): string {
  const shop = sanitizeStoragePathSegment(input.shopDomain) || 'unknown-shop'
  const ext = extensionFromContentType(contentType)
  return `try-on/results/${shop}/${input.jobId}/result.${ext}`
}

export function createClientFromOptions(options: S3StorageGatewayOptions): S3Client {
  if (options.client) {
    return options.client
  }

  if (!options.credentials || !options.endpoint) {
    throw new Error('S3StorageGateway requires either a client or credentials + endpoint.')
  }

  return new S3Client({
    credentials: options.credentials,
    endpoint: options.endpoint,
    forcePathStyle: options.forcePathStyle ?? true,
    region: options.region ?? DEFAULT_REGION,
  })
}

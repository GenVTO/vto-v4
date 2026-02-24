import type { PersistTryOnResultInput, PutObjectInput } from '@vto/types'

const MAX_PATH_SEGMENT_LENGTH = 80

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

export async function toUint8Array(body: PutObjectInput['body']): Promise<Uint8Array> {
  if (body instanceof Uint8Array) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) {
    return readStreamToUint8Array(body)
  }

  return new Uint8Array()
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
  return `${shop}/${input.jobId}/result/image.${ext}`
}

export async function downloadProviderResult(
  url: string,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Provider result download failed (${response.status})`)
  }
  const contentTypeHeader = response.headers.get('content-type')
  const contentType = contentTypeHeader?.split(';')[0]?.trim() || 'image/jpeg'
  const body = await response.arrayBuffer()
  return { body, contentType }
}

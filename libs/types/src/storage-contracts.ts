export interface PutObjectInput {
  key: string
  body: Uint8Array | ArrayBuffer | ReadableStream
  contentType: string
  metadata?: Record<string, string>
}

export interface SignedUrlOptions {
  expiresInSeconds: number
  method?: 'GET' | 'PUT'
}

export interface PersistTryOnResultInput {
  jobId: string
  shopDomain: string
  providerName?: string | null
  providerResultUrl: string
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, string>
}

export interface PersistTryOnResultOutput {
  key: string
  resultUrl: string
  contentType: string
  sizeBytes: number
}

export interface StorageGateway {
  put(input: PutObjectInput): Promise<{ key: string }>
  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string>
  exists(key: string): Promise<boolean>
  copy(sourceKey: string, destinationKey: string): Promise<void>
  delete(key: string): Promise<void>
  persistTryOnResult(input: PersistTryOnResultInput): Promise<PersistTryOnResultOutput>
}

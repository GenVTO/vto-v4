import type { S3Client } from '@aws-sdk/client-s3'
import type {
  PersistTryOnResultInput,
  PersistTryOnResultOutput,
  PutObjectInput,
  SignedUrlOptions,
  StorageGateway,
} from '@vto/types'

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner'
import { parseS3Env } from '@vto/env/s3'
import { createLogger } from '@vto/logger'

import {
  bodyToS3Body,
  buildTryOnResultKey,
  createClientFromOptions,
  isNotFoundError,
  normalizePublicUrl,
  toCopySource,
} from './helpers'

const storageLogger = createLogger({ service: '@vto/s3-storage' })
const DEFAULT_REGION = 'us-east-1'
const SECONDS_IN_MINUTE = 60
const MINUTES_IN_HOUR = 60
const HOURS_IN_DAY = 24
const DAYS_IN_WEEK = 7
const DEFAULT_TTL_DAYS = 30

// Max allowed for V4 signature is 7 days. We use 6 days to be safe.
const MAX_URL_TTL_SECONDS = SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * (DAYS_IN_WEEK - 1)

type PresignCommand = GetObjectCommand | PutObjectCommand

type PresignFn = (
  client: S3Client,
  command: PresignCommand,
  options: { expiresIn: number },
) => Promise<string>

export interface S3StorageGatewayOptions {
  bucket: string
  client?: S3Client
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  endpoint?: string
  forcePathStyle?: boolean
  publicBaseUrl?: string
  region?: string
  signUrl?: PresignFn
  resultTtlDays?: number
}

export class S3StorageGateway implements StorageGateway {
  private readonly bucket: string
  private readonly client: S3Client
  private readonly publicBaseUrl: string | null
  private readonly signUrl: PresignFn
  private readonly resultTtlDays: number

  constructor(options: S3StorageGatewayOptions) {
    this.bucket = options.bucket
    this.client = createClientFromOptions(options)
    this.publicBaseUrl = options.publicBaseUrl ?? null
    this.signUrl = options.signUrl ?? awsGetSignedUrl
    this.resultTtlDays = options.resultTtlDays ?? DEFAULT_TTL_DAYS

    storageLogger.info('S3 storage initialized', {
      bucket: this.bucket,
      endpoint: options.endpoint ?? null,
      force_path_style: options.forcePathStyle ?? true,
      region: options.region ?? DEFAULT_REGION,
      result_ttl_days: this.resultTtlDays,
    })
  }

  async put(input: PutObjectInput): Promise<{ key: string }> {
    const command = new PutObjectCommand({
      Body: await bodyToS3Body(input.body),
      Bucket: this.bucket,
      ContentType: input.contentType,
      Key: input.key,
      Metadata: input.metadata,
    })

    await this.client.send(command)
    storageLogger.debug('S3 put object', {
      content_type: input.contentType,
      key: input.key,
    })

    return { key: input.key }
  }

  async getSignedUrl(key: string, options: SignedUrlOptions): Promise<string> {
    if (options.method !== 'PUT' && this.publicBaseUrl) {
      return normalizePublicUrl(this.publicBaseUrl, key)
    }

    const command: PresignCommand =
      options.method === 'PUT'
        ? new PutObjectCommand({ Bucket: this.bucket, Key: key })
        : new GetObjectCommand({ Bucket: this.bucket, Key: key })

    return this.signUrl(this.client, command, {
      expiresIn: options.expiresInSeconds,
    })
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
      return true
    } catch (error) {
      if (isNotFoundError(error)) {
        return false
      }
      throw error
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: toCopySource(this.bucket, sourceKey),
        Key: destinationKey,
      }),
    )

    storageLogger.debug('S3 copy object', {
      destination_key: destinationKey,
      source_key: sourceKey,
    })
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )

    storageLogger.debug('S3 delete object', { key })
  }

  async persistTryOnResult(input: PersistTryOnResultInput): Promise<PersistTryOnResultOutput> {
    storageLogger.info('Persisting try-on result in S3 storage', {
      job_id: input.jobId,
      provider: input.providerName ?? 'unknown',
      source_url: input.providerResultUrl,
    })

    const { body, contentType } = await this.downloadProviderResult(input.providerResultUrl)
    const key = buildTryOnResultKey(input, contentType)

    await this.uploadResultToS3({
      body,
      contentType,
      input,
      key,
    })

    const requestedTtlSeconds =
      this.resultTtlDays * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE

    // AWS SDK throws if expiresIn > 7 days (604800s).
    // If the user requests > 7 days, we cap it at 6 days for the URL signature
    // But log a warning that the URL will expire before the intended retention.
    let urlExpiresInSeconds = requestedTtlSeconds
    if (requestedTtlSeconds > MAX_URL_TTL_SECONDS) {
      storageLogger.warn(
        `Requested result TTL (${this.resultTtlDays} days) exceeds maximum allowed for signed URLs (7 days). Capping URL expiration to 6 days.`,
        {
          job_id: input.jobId,
          requested_days: this.resultTtlDays,
        },
      )
      urlExpiresInSeconds = MAX_URL_TTL_SECONDS
    }

    const resultUrl = await this.getSignedUrl(key, {
      expiresInSeconds: urlExpiresInSeconds,
    })

    return {
      contentType,
      key,
      resultUrl,
      sizeBytes: body.byteLength,
    }
  }

  private async downloadProviderResult(
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

  private async uploadResultToS3(params: {
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

export function createS3StorageGateway(options: S3StorageGatewayOptions): StorageGateway {
  return new S3StorageGateway(options)
}

export function createS3StorageGatewayFromEnv(
  source?: Record<string, string | undefined>,
): StorageGateway {
  const env = parseS3Env(source)

  return createS3StorageGateway({
    bucket: env.S3_BUCKET,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      sessionToken: env.S3_SESSION_TOKEN,
    },
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL,
    region: env.S3_REGION,
    resultTtlDays: env.TRYON_RESULT_TTL_DAYS,
  })
}

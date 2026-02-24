# @vto/s3-storage

S3-compatible storage provider implementing `StorageGateway`.

Supports:

- Supabase S3-compatible endpoint
- AWS S3
- Any S3-compatible object storage

## Usage

```ts
import { createS3StorageGateway, createS3StorageGatewayFromEnv } from '@vto/s3-storage'

const storage = createS3StorageGateway({
  bucket: 'tryon-assets',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true,
  publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  region: process.env.S3_REGION ?? 'us-east-1',
})

const storageFromEnv = createS3StorageGatewayFromEnv({
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
  S3_REGION: process.env.S3_REGION,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_SESSION_TOKEN: process.env.S3_SESSION_TOKEN,
})
```

If `publicBaseUrl` is provided, `getSignedUrl(..., { method: 'GET' })` returns a public URL.
For `PUT`, signed URL generation is always used.

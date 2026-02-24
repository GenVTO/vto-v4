# @vto/storage

Abstract storage layer and contracts.

## Overview

Defines the `StorageGateway` interface used for object storage operations (uploading images, checking existence, etc.). This allows the application to support multiple storage providers (e.g., Cloudflare R2, AWS S3, Local Disk) interchangeably.

Also includes:

- `createStorageGatewayChain` to compose multiple providers with ordered fallback.
- `createStorageGateway` to resolve providers from env/bindings inside the gateway.

## Contracts

### `StorageGateway`

```typescript
export interface StorageGateway {
  put(input: PutObjectInput): Promise<{ key: string }>
  getSignedUrl(key: string, options: SignedUrlOptions): Promise<string>
  exists(key: string): Promise<boolean>
  copy(sourceKey: string, destinationKey: string): Promise<void>
  delete(key: string): Promise<void>
}
```

### Configuration

Configuration is managed via `@vto/env`.

- **`STORAGE_PROVIDER_ORDER`**: Comma-separated list of providers. Format: `type:name`.
  - `r2:primary` -> R2 provider named "primary".
  - `s3:backup` -> S3 provider named "backup".
  - `disk` -> Local disk provider (no name needed).

- **`R2_CONFIGS_JSON`**: JSON array of R2 bucket bindings.

  ```json
  [
    { "name": "primary", "binding": "TRYON_ASSETS_PRIMARY" },
    { "name": "backup", "binding": "TRYON_ASSETS_BACKUP" }
  ]
  ```

- **`S3_CONFIGS_JSON`**: JSON array of S3 configurations.
  ```json
  [
    {
      "name": "supabase",
      "endpoint": "https://project.supabase.co/storage/v1/s3",
      "bucket": "tryon-a",
      "accessKeyId": "...",
      "secretAccessKey": "..."
    }
  ]
  ```

## Usage

Apps can stay agnostic and use only `@vto/storage`.

```typescript
import { createStorageGateway } from '@vto/storage'

const storage = createStorageGateway({
  bindings: runtimeBindings, // Cloudflare bindings (optional)
})
```

Example env strategy for multiple providers:

- `STORAGE_PROVIDER_ORDER=r2:primary,s3:supabase,s3:aws,r2:backup,disk`
- `R2_CONFIGS_JSON=[{"name":"primary","binding":"TRYON_ASSETS_PRIMARY"},{"name":"backup","binding":"TRYON_ASSETS_BACKUP"}]`
- `S3_CONFIGS_JSON=[{"name":"supabase","endpoint":"https://project.supabase.co/storage/v1/s3","bucket":"tryon-a","accessKeyId":"...","secretAccessKey":"..."},{"name":"aws","endpoint":"https://s3.eu-west-1.amazonaws.com","bucket":"tryon-b","accessKeyId":"...","secretAccessKey":"..."}]`

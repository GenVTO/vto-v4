# @vto/r2-storage

Cloudflare R2 implementation of the Storage Gateway.

## Overview

This library implements the `StorageGateway` interface (from `@vto/storage`) using Cloudflare R2. It is designed to work within the Cloudflare Workers runtime where `R2Bucket` bindings are available.

## Usage

It requires an `R2Bucket` (or an object matching the `R2LikeBucket` interface) to be passed to the constructor.

```typescript
import { R2StorageGateway } from '@vto/r2-storage'

// In a Cloudflare Worker environment
const bucket = env.MY_BUCKET

const storage = new R2StorageGateway(bucket)

await storage.put({
  key: 'uploads/image.jpg',
  body: fileStream,
  contentType: 'image/jpeg',
})
```

## Notes

- **Signed URLs**: Currently, `getSignedUrl` is not implemented for R2 as it requires S3 compatibility layer or specific worker logic not yet added.
- **Copy**: `copy` operation is not yet implemented.

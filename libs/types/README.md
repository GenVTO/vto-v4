# @vto/types

Shared TypeScript definitions, constants, and schemas.

## Overview

A central repository for types used across the monorepo to ensure consistency and avoid circular dependencies.

## Contents

- **API Errors**: `ApiError` interface and error codes.
- **HTTP Status**: Constants and helper functions for HTTP status codes (`HTTP_STATUS`).
- **Try-On Domain**: Core types for the try-on domain.
  - `TryOnJob`: Represents the state of a try-on process (id, status, resultUrl, etc.).
  - `CreateTryOnRequest`: Input payload for creating a job (product_id, user_image, etc.).
  - `TryOnModel`: Available AI models (e.g., `'normal'`, `'advanced'`).
- **Storage Domain**:
  - `StorageGateway`: Interface for file operations (put, get, delete).
- **Database Domain**:
  - `DbGateway`: Interface for database operations (jobs, credits, tenants).
- **Schemas**: Zod schemas for runtime validation of API requests and responses.

## Usage

```typescript
import { HTTP_STATUS } from '@vto/types'
import type { TryOnJob } from '@vto/types'
import { createTryOnRequestSchema } from '@vto/types/schemas'

const status = HTTP_STATUS.OK // 200
```

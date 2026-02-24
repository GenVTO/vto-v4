# @vto/try-on

Core domain logic for the Virtual Try-On service.

## Overview

This library contains the business logic for managing try-on jobs. It acts as the "Gateway" or "Controller" that coordinates between:

- **Database** (`@vto/db`): For storing job state, credits, and history.
- **Providers** (`TryOnProvider`): External AI services (like Fashn.ai) that perform the actual generation.

## Execution Flow

When `runTryOn` is called:

1.  **Validation**:
    - Checks input data (Zod schemas).
    - Verifies Tenant/Shop match.
2.  **Idempotency Check**:
    - If `idempotency_key` is provided, checks if a job already exists.
3.  **Caching**:
    - Generates a hash of `(shop_domain, product_id, user_image)`.
    - Checks DB for a completed job with the same hash (within TTL).
    - Returns cached result if found (saving credits).
4.  **Credit Check**:
    - Verifies the tenant has enough credits.
    - Reserves a credit.
5.  **Job Creation**:
    - Creates a `pending` job in the database.
6.  **Provider Selection**:
    - Iterates through `TRYON_PROVIDER_ORDER` for the requested model.
    - Submits the job to the first available provider.
7.  **Finalization**:
    - Updates job with provider reference.
    - Commits the credit transaction.

## Key Components

### `TryOnGateway`

The main entry point for the try-on functionality.

```typescript
export interface TryOnGateway {
  runTryOn(input: CreateTryOnRequest, context: RunTryOnContext): Promise<CreateTryOnResponse>
  getJobStatus(jobId: string, context: RunTryOnContext): Promise<TryOnJob | null>
  getHistory(query: TryOnHistoryQuery, context: RunTryOnContext): Promise<TryOnHistoryResponse>
  cancelJob(jobId: string): Promise<{ cancelled: boolean }>
}
```

### Features

- **Idempotency**: Handles duplicate requests using idempotency keys.
- **Caching**: Returns cached results for identical requests (same product + same user image) to save credits and time.
- **Credit System**: Manages tenant credits, ensuring users have enough balance before processing.
- **Validation**: Validates inputs and business rules (e.g., tenant/shop matching).

## Usage

```typescript
import { createTryOnGatewayFromEnv } from '@vto/try-on'

const gateway = createTryOnGatewayFromEnv({ db: myDbGateway })

const result = await gateway.runTryOn(requestData, context)
```

### Provider order / fallback

Use `TRYON_PROVIDER_ORDER` (comma-separated) to define fallback order per model.

Example:

- `TRYON_PROVIDER_ORDER=fashn,vertex,gemini`

The gateway tries providers in order until one accepts the job.

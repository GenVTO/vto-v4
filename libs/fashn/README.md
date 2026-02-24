# @vto/fashn

Client library for the Fashn.ai Virtual Try-On API.

## Overview

This library provides a type-safe client for interacting with the Fashn.ai API. It includes both a real HTTP client and a mock client for development/testing purposes.

## Key Components

### `FashnClient` Interface

Defines the contract for Fashn interactions:

```typescript
export interface FashnClient {
  run(payload: {
    model: 'fashn-v1.6' | 'fashn-max'
    productImageUrl: string
    personImageUrl: string
    params?: Record<string, unknown>
  }): Promise<{ id: string }>

  status(jobId: string): Promise<TryOnProviderStatusResult>
}
```

### `FashnApiClient`

The production implementation that makes actual HTTP requests to Fashn.ai.

- Handles authentication via Bearer token.
- Validates responses using Zod schemas.
- Maps Fashn statuses to the internal `TryOnProviderStatusResult`.

### `MockFashnClient`

A simulation client that:

- Does not make network requests.
- Simulates delays.
- Can be configured to fail with a certain probability (`failRate`).
- Useful for local development without consuming API credits.

## Usage

```typescript
import { createFashnClientFromEnv, MockFashnClient } from '@vto/fashn'

// Create from environment variables (FASHN_API_KEY, etc.)
const client = createFashnClientFromEnv({ env: process.env })

// Or use the mock client
const mock = new MockFashnClient({ failRate: 0.1 })

// Run a try-on job
const { id } = await client.run({
  model: 'fashn-v1.6',
  productImageUrl: '...',
  personImageUrl: '...',
})

// Check status
const status = await client.status(id)
```

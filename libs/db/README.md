# @vto/db

Core database abstraction and contracts for the Virtual Try-On application.

## Overview

This library defines the `DbGateway` interface, which acts as the contract for all database operations in the system. It abstracts away the underlying database implementation (e.g., Supabase, In-Memory), allowing the core logic to remain agnostic of the persistence layer.

## Key Interfaces

### `DbGateway`

The main interface that any database adapter must implement.

```typescript
export interface DbGateway {
  // Tenant & Credit Management
  validateApiKey(apiKey: string): Promise<{ tenantId: string; shopDomain: string } | null>
  hasCredits(tenantId: string): Promise<boolean>
  reserveCreditForJob(tenantId: string, jobId: string): Promise<void>
  recordCreditEvent(input: CreditEventInput): Promise<void>

  // Job Caching & Idempotency
  findCachedResult(input: { ... }): Promise<TryOnJob | null>
  findJobByIdempotency(tenantId: string, key: string): Promise<TryOnJob | null>
  saveJobIdempotency(tenantId: string, key: string, jobId: string): Promise<void>

  // Job Management
  createJob(input: CreateJobInput): Promise<TryOnJob>
  updateJobStatus(input: { ... }): Promise<void>
  getJob(jobId: string): Promise<TryOnJob | null>
  getHistory(query: TryOnHistoryQuery): Promise<{ items: TryOnJob[]; total: number }>
}
```

## Implementations

- **In-Memory**: A simple in-memory implementation useful for testing and local development without a real database.
- **Supabase**: (See `@vto/supabase-db`) A production-ready implementation using Supabase.

## Usage

```typescript
import { createDbGateway } from '@vto/db'

const db = createDbGateway()
```

### Provider selection (inside gateway)

`createDbGateway` decides provider based on env:

- uses Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist
- otherwise falls back to in-memory (with optional seed)

```typescript
import { createDbGateway } from '@vto/db'

const db = createDbGateway({
  seedTenants: [{ apiKey: 'test', tenantId: 't1', shopDomain: 'shop.myshopify.com', credits: 100 }],
})

const job = await db.createJob({ ... })
```

# @vto/supabase-db

Supabase implementation of the Database Gateway for the VTO application.

This library provides a concrete implementation of the `DbGateway` interface (defined in `@vto/db`) using the Supabase JavaScript client. It handles data persistence for API keys, credit management, and virtual try-on job history.

## Features

- **DbGateway Implementation**: Fully implements the `DbGateway` interface.
- **Supabase Integration**: Uses `@supabase/supabase-js` for database operations.
- **Schema Management**: Includes SQL migrations and seed data for local development.
- **Type Safety**: Strongly typed database rows and query results.

## Installation

```bash
pnpm add @vto/supabase-db @supabase/supabase-js
```

## Usage

Initialize the gateway with a Supabase client instance.

```typescript
import { createClient } from '@supabase/supabase-js'
import { createSupabaseDbGateway } from '@vto/supabase-db'
import type { DbGateway } from '@vto/types'

// 1. Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 2. Create DB Gateway
const db: DbGateway = createSupabaseDbGateway(supabase, {
  schema: 'public', // Optional: specify schema
})

// 3. Use the gateway
const apiKeyData = await db.validateApiKey('some-api-key-hash')
if (apiKeyData) {
  console.log('Valid API Key for shop:', apiKeyData.shopDomain)
}

const job = await db.createJob({
  id: 'job-123',
  shopDomain: 'example.myshopify.com',
  productId: 'prod_1',
  visitorId: 'visitor_1',
  model: 'normal',
  userImageHash: 'hash_123',
  creditsCharged: 1,
})
```

## Database Schema

The library includes migration files in `supabase/migrations/` which define the following core tables:

- `api_keys`: Stores hashed API keys and links them to tenants.
- `tenants`: Stores shop domains and tenant configuration.
- `credit_ledgers`: Tracks available credits for each tenant.
- `tryon_jobs`: Stores the history and status of virtual try-on requests.

## Development

### Database Commands

Run these commands from the monorepo root (using `pnpm --filter @vto/supabase-db ...`) or inside the library directory:

- **Start local DB**: `pnpm db:start`
- **Reset local DB**: `pnpm db:reset` (applies migrations and seeds)
- **Check status**: `pnpm db:status`
- **Stop local DB**: `pnpm db:stop`
- **Push to remote**: `pnpm db:push` (applies migrations to remote Supabase project)
- **Generate DB types from local DB**: `pnpm db:types`
- **Generate DB types from linked project**: `pnpm db:types:linked`
- **Generate DB types from specific project ref**: `SUPABASE_PROJECT_ID=<project-ref> pnpm db:types:project`

Generated DB types live at:

- `src/generated/database.types.ts`
- `src/types.ts` with explicit aliases per table:
  - `TenantRow`, `TenantInsert`, `TenantUpdate`
  - `ApiKeyRow`, `ApiKeyInsert`, `ApiKeyUpdate`
  - `CreditLedgerRow`, `CreditLedgerInsert`, `CreditLedgerUpdate`
  - `TryOnJobRow`, `TryOnJobInsert`, `TryOnJobUpdate`
  - `UserImageRow`, `UserImageInsert`, `UserImageUpdate`

### Migrations

Migrations are managed via the Supabase CLI.

1. Make changes to the database (e.g., via Studio or SQL).
2. Generate a migration file: `supabase db diff -f name_of_change`.
3. Commit the new migration file in `supabase/migrations/`.

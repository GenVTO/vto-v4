# Data Model Specification (MVP)

## Data Providers

- Database: Supabase Postgres (target).
- Storage: Cloudflare R2 (target).

## Core Tables (Initial)

- `tenants`
- `api_keys`
- `credit_ledgers`
- `tryon_jobs`
- `user_images`

`tryon_attempts` is deferred from MVP unless needed for debugging/fallback implementation.

## Suggested Table Responsibilities

### tenants

Tenant identity and Shopify binding.

- `id`
- `shop_domain` (unique)
- `app_installed` (boolean)
- `created_at`, `updated_at`

### api_keys

Server-side keys (hashed storage).

- `id`
- `tenant_id`
- `key_hash`
- `is_active`
- `created_at`, `updated_at`, `last_used_at`

### credit_ledgers

Immutable credit events.

- `id`
- `tenant_id`
- `event_type` (`topup`, `debit_tryon`, `refund`, `adjustment`)
- `amount_credits`
- `amount_usd` (optional)
- `metadata` (jsonb)
- `created_at`

### user_images

Hash and storage references for reuse.

- `id`
- `tenant_id`
- `visitor_id`
- `customer_id` (nullable)
- `image_hash`
- `storage_url`
- `expires_at`
- `created_at`

### tryon_jobs

Try-on lifecycle records.

- `id`
- `tenant_id`
- `shop_domain`
- `product_id`
- `shopify_product_handle` (optional)
- `visitor_id`
- `customer_id` (nullable)
- `model` (`normal`, `advanced`)
- `status` (`queued`, `processing`, `completed`, `failed`, `provider_expired`)
- `provider_job_id` (nullable)
- `user_image_hash`
- `result_url` (nullable)
- `credits_charged`
- `failure_reason_normalized` (nullable)
- `created_at`, `updated_at`

## Cache Key

MVP cache key:

`shop_domain + product_id + user_image_hash`

## Pagination Strategy

- `offset/limit`
- Sort by `created_at DESC`

## Multi-Tenancy

- Tenant identity tied to `shop_domain`.
- RLS enabled in Supabase target architecture.
- Backend-only DB access in MVP.

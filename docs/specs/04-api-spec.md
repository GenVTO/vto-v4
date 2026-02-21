# API Specification (MVP)

## Base Path

`/api/v1`

## Authentication

- API key via `x-api-key` header (or `Authorization: Bearer <key>` for backend calls).
- Shopify storefront browser should call Shopify App Proxy, not platform API directly.

## Endpoints

### POST `/api/v1/try-on`

Creates a try-on job asynchronously.

#### Input

- Supports `application/json` and `multipart/form-data`.
- Required fields:
  - `shop_domain`
  - `product_id`
  - `product_image_url`
  - `visitor_id`
  - `user_image_url` (JSON mode) or `user_image` (multipart mode)
- Optional fields:
  - `customer_id`
  - `model` (`normal` | `advanced`, default: `advanced`)
  - `idempotency_key`
  - `metadata`

#### Behavior

1. Validate auth and tenant.
2. Validate payload schema.
3. Check idempotency key (if provided).
4. Compute `user_image_hash` and check cache.
5. If cache hit, return `completed` with existing result, no charge.
6. If no cache hit, create job and submit to provider.
7. Charge 1 credit when provider returns `provider_job_id`.
8. Return accepted response.

#### Response (202)

- `request_id`
- `job_id`
- `status`
- `cache_hit`
- `credits_charged`
- `result_url` (nullable)

### GET `/api/v1/try-on/:id`

Returns current job status.

#### Behavior

- Validate auth and tenant access.
- If job is final, return current data.
- If job is non-final and has provider job id, query provider status and persist transition.

#### Response (200)

- `request_id`
- `id`
- `status`
- `result_url`
- `provider_job_id`
- `updated_at`

### GET `/api/v1/try-on/history`

Returns paginated job history.

#### Query params

- `shop_domain` (required)
- `visitor_id` (required)
- `product_id` (optional)
- `limit` (default 10, max 50)
- `offset` (default 0)

## Error Contract

Error payload shape:

- `code`
- `message`
- `request_id`
- `details` (optional)

Canonical codes:

- `INVALID_INPUT`
- `UNAUTHORIZED`
- `INSUFFICIENT_CREDITS`
- `RATE_LIMITED`
- `PROVIDER_TIMEOUT`
- `PROVIDER_FAILED`
- `INTERNAL_ERROR`

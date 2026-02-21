# ADR-005: Caching and Idempotency

## Status

Accepted

## Decision

- Use cache key: `shop_domain + product_id + user_image_hash`.
- Support idempotency key (optional in API, recommended in Shopify backend).
- Cache hits do not consume credits.

## Rationale

- Reduce provider costs and latency for repeated try-ons.
- Prevent duplicate charging in retry scenarios where idempotency is applied.

## Consequences

- Cache invalidation does not include product image fingerprint in MVP.
- Potential stale reuse accepted until TTL expiration.

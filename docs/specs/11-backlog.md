# Implementation Backlog

## P0 (Immediate)

- [ ] Add Supabase SQL schema and migrations.
- [ ] Add seed scripts for dev tenant, API key, and credits.
- [ ] Implement `libs/supabase-db` gateway methods.
- [ ] Add API key hash utilities and validation.
- [ ] Implement real Fashn client in `libs/fashn`.
- [ ] Wire result persistence to storage gateway.
- [ ] Add history query indexes in DB.
- [ ] Add normalized failure reason mapping.

## P1 (Next)

- [ ] Add Shopify App Proxy signature validation middleware.
- [ ] Add request/response structured logging integration with LogLayer.
- [ ] Add storage retry strategy in gateway.
- [ ] Add end-to-end integration tests (mocked external services).
- [ ] Add rate-limit middleware defaults (60/min, burst 20).

## P2 (Later)

- [ ] Add fallback multi-provider orchestration strategy.
- [ ] Add support for configurable provider order per tenant.
- [ ] Add admin/internal tools for credit adjustments.
- [ ] Add legal/consent policy screens and records.
- [ ] Add operational alerting.

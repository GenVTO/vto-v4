# Delivery Plan

## Phase 0 - Foundation (Done)

- Monorepo scaffold.
- Workspace packages and contracts.
- API route skeleton.
- Mock runtime integration.

## Phase 1 - Core Functional Flow

- Implement DB schema and persistence (Supabase).
- Replace in-memory DB gateway with real Supabase gateway.
- Implement Fashn real HTTP client (submit/status).
- Implement polling lifecycle with durable status updates.
- Implement storage writes and URL references.

## Phase 2 - Shopify Path Hardening

- App Proxy signature validation.
- Tenant verification and binding hardening.
- Product image metadata fallback behavior.
- Anonymous + logged-in identity handling.

## Phase 3 - UX and Product Features

- Product-page try-on module.
- PiP/floating progress UX on desktop.
- Mobile-friendly history navigation.
- History pagination and UI rendering.

## Phase 4 - Reliability Improvements

- Optional reconciler for stuck jobs.
- Extended provider fallback strategy.
- Better operational dashboards and alerts.

## Delivery Philosophy

Ship the minimal end-to-end revenue path first, then harden incrementally.

# MVP Scope

## In Scope

- Monorepo with `apps/*` and `libs/*`.
- `apps/web` (Astro) hosting API and basic API playground form.
- Try-on API v1 (async job flow):
  - `POST /api/v1/try-on`
  - `GET /api/v1/try-on/:id`
  - `GET /api/v1/try-on/history`
- Provider abstraction with Fashn as first implementation.
- Model abstraction exposed as:
  - `normal` -> internal mapping to Fashn 1.6
  - `advanced` -> internal mapping to Fashn Max
- Storage abstraction with R2 as initial implementation target.
- DB abstraction with Supabase as initial implementation target.
- Credit-based usage control.
- Cache by `shop_domain + product_id + user_image_hash`.
- Polling-based async lifecycle (no webhooks in MVP).

## Out of Scope (MVP)

- Rich admin dashboard.
- Automated key rotation.
- Formal compliance program (SOC2, full GDPR workflows).
- Advanced moderation pipeline.
- Force-regenerate feature.
- Multi-provider production fallback as a first-class shipped feature (may be delayed if needed).
- Full legal policy suite and account self-service deletion portal.

## Explicit Trade-Offs

- Prioritize shipping core generation flow over advanced UX polish.
- Accept manual operations for some admin tasks.
- Accept polling without reconciler worker for MVP.

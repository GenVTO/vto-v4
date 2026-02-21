# Architecture Specification

## Monorepo Strategy

- Package manager: `pnpm` workspaces.
- No Turborepo for MVP.
- Libraries are source-exported directly from `src` (no separate lib build step).
- Only application build is required.

## Workspace Layout

- `apps/web`
- `libs/types`
- `libs/env`
- `libs/try-on`
- `libs/fashn`
- `libs/storage`
- `libs/r2-storage`
- `libs/db`
- `libs/supabase-db`

## Runtime Targets

- Astro app with Cloudflare adapter.
- Workerd-compatible runtime assumptions.
- API hosted under same domain with versioned path (`/api/v1/...`).

## Layering

1. API routes (`apps/web`) for request/response handling.
2. Gateway layer (`libs/try-on`, `libs/storage`, `libs/db`) with stable interfaces.
3. Provider implementations (`libs/fashn`, `libs/r2-storage`, `libs/supabase-db`).
4. Shared contracts (`libs/types`, `libs/env`).

## Provider Abstraction Rules

- Public API consumers do not pass provider names.
- Public API passes `model` semantic values (`normal`, `advanced`).
- Internal mapping resolves model -> provider + model variant.
- Provider-specific extra fields are filtered/normalized at gateway layer.

## Async Flow Architecture

MVP uses request-triggered polling:

- Client polls platform API every 3 seconds.
- API queries DB for current status.
- If status is non-final and provider job ID exists, API checks provider status.
- API persists updated status and returns state.

No dedicated reconciler/cron for MVP.

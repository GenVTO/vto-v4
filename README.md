# VTO v4 Monorepo (MVP Scaffold)

## Workspace layout

- `apps/web`: Astro app with API routes, marketing landing, and try-on playground.
- `libs/types`: shared cross-lib TypeScript types and Zod schemas.
- `libs/env`: shared environment parsers (Zod).
- `libs/try-on`: provider gateway contracts and orchestrator.
- `libs/fashn`: Fashn provider adapter contract + mock provider client.
- `libs/storage`: storage gateway contracts.
- `libs/r2-storage`: R2 storage adapter scaffold.
- `libs/db`: database gateway contracts + in-memory gateway for MVP dev.
- `libs/supabase-db`: Supabase DB adapter scaffold.

## Web app additions

- Tailwind CSS v4 via `@tailwindcss/vite`.
- shadcn/ui baseline setup (`components.json`, `cn` utility, `Button` component).
- React integration for UI component composition.
- Marketing landing page focused on Shopify app sales.

## API scaffold (wired to runtime mocks)

- `POST /api/v1/try-on`
- `GET /api/v1/try-on/:id`
- `GET /api/v1/try-on/history`

Routes are connected to `TryOnGateway` + `DbGateway` and use a mocked Fashn client.

## Local seeded auth (mock runtime)

- `api_key`: `dev_vto_api_key`
- `shop_domain`: `demo-shop.myshopify.com`
- initial credits: `1000`

## Tooling

- `oxlint` for linting.
- `oxfmt` for JS/TS formatting.
- Prettier + Astro plugin for `.astro` files only.

### Commands

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm format`
- `pnpm format:check`

## Package strategy

Workspace libraries do not build into `dist` for MVP. Each lib exports directly from `src` through `package.json` exports.

## Next implementation targets

1. Replace in-memory DB with Supabase implementation (`libs/supabase-db`).
2. Add real Fashn HTTP client implementation.
3. Add storage persistence flow (R2) for result URLs.
4. Add Shopify App Proxy signature validation and tenant binding.

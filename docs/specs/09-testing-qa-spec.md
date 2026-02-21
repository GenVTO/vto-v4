# Testing and QA Specification (MVP)

## Tooling

- Test runner: Vitest.
- Coverage provider: V8.
- DOM env for UI/component tests: happy-dom.

## Strategy

- High-coverage objective for MVP (not hard-blocking at 100%).
- Unit tests for gateway contracts and provider mappings.
- Endpoint behavior tests for API contract correctness.
- Mock providers for cost-safe async behavior simulation.

## Non-Negotiable Test Areas

- Request schema validation and error mapping.
- Credit charging logic and cache hit no-charge behavior.
- Idempotency behavior.
- Async status transitions via polling.
- Tenant access isolation basics.

## Deferred Testing

- Real provider contract tests against paid external APIs.
- Full load/performance testing at production scale.

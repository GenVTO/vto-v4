# ADR-001: Monorepo and Build Strategy

## Status

Accepted

## Decision

Use `pnpm` workspaces with `apps/*` and `libs/*`, exporting library source directly from `src` without separate lib build artifacts for MVP.

## Rationale

- Lowest setup overhead.
- Fast iteration in early MVP.
- Avoid unnecessary pipeline complexity before product-market validation.

## Consequences

- Consumer runtime/toolchain must support TS source consumption.
- Build responsibility remains primarily on apps.

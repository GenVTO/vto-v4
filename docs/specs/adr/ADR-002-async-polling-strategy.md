# ADR-002: Async Polling Strategy

## Status

Accepted

## Decision

Use async job creation with client-driven polling every ~3 seconds to track provider status.

## Rationale

- Provider generation times can exceed 40 seconds.
- Polling is simpler than webhook orchestration for MVP.
- Enables non-blocking shopper UX.

## Consequences

- Jobs may remain pending without active polling.
- No automatic reconciler in MVP.

# ADR-003: Model and Provider Abstraction

## Status

Accepted

## Decision

Expose abstract model names in public API (`normal`, `advanced`) and map internally to provider-specific models.

## Rationale

- Decouples public contract from third-party provider naming.
- Reduces provider lock-in and information leakage.
- Enables future internal remapping without breaking clients.

## Consequences

- Gateway must maintain mapping logic and payload normalization.

# ADR-004: Credit Charging Policy

## Status

Accepted

## Decision

Charge 1 credit when provider submit returns provider job id successfully.

## Rationale

- Reflects the moment external provider cost is effectively incurred.
- Avoids charging on pre-submit validation failures.

## Consequences

- No automatic refund in MVP for later provider failures/timeouts.

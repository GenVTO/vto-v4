# Observability and Operations Specification (MVP)

## Logging

- Structured JSON logs.
- Log abstraction: LogLayer-based transport architecture.
- Production server log level default: `info`.
- Browser/client log level default: `warn`.

## Required Event Coverage

- `job_created`
- `job_queued`
- `provider_requested`
- `provider_accepted`
- `provider_polled`
- `provider_failed`
- `job_succeeded`
- `job_failed`
- `credits_charged`

## Required Log Context Fields

- `timestamp`
- `level`
- `request_id`
- `tenant`
- `job_id`
- `event`

## Failure Handling

- Provider failure should persist normalized failure reason.
- If all relevant attempts fail, return standardized API error code.
- Storage failures after generation should trigger storage retries, not extra credit charge.

## Monitoring Approach (MVP)

- Manual operational checks via SQL/Supabase dashboard.
- No automated alerting thresholds in MVP.

## Operational Ownership

- Single operator model (founder/solo maintainer).
- Expected maintenance budget: ~10h/week.

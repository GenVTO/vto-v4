# Security and Privacy Specification (MVP)

## Data Handling

- Store user images and result images for reuse and history.
- Default retention target: 15 days (configurable).
- Original user image may be stored in MVP for cache reuse.

## Sensitive Data Practices

- Do not log raw image binaries.
- Redact sensitive headers from logs (`authorization`, `cookie`).
- Keep API keys hashed at rest.

## Legal/Consent Baseline (MVP)

- Add explicit user confirmation checkbox in UI:
  - user confirms rights to upload/process the image.
- Full legal policy expansion deferred.

## File Validation

- Validate MIME/file type at backend.
- Accept image inputs and normalize to JPG in processing flow.
- Max image size target: 5 MB per image.
- Max request payload target: 8 MB.

## Privacy Trade-Offs Accepted for MVP

- No full compliance automation program in MVP.
- No user self-service delete endpoint in MVP.
- No advanced moderation/age verification in MVP.

## Access Control

- Browser should not call platform API directly with platform key.
- Shopify App Proxy/backend-to-backend forwarding is preferred path.

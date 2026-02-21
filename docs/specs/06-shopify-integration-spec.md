# Shopify Integration Specification (MVP)

## Channel

Shopify storefront experience for end shoppers.

## Request Path

1. Browser calls Shopify App Proxy endpoint.
2. Shopify app backend validates request and forwards to platform API.
3. Backend adds platform API key (never expose platform key to browser).

## Product Image Selection

- Product image source from Shopify metadata/tags strategy.
- Fallback to `featured_image`.
- If still missing, fallback to first available image.

## User Identity Modes

- Logged-in users: store `customer_id`.
- Anonymous users: store `customer_id = null` and use persistent `visitor_id` cookie.

## Visitor Identifier

- Cookie-based (`vto_vid` suggested).
- Long-lived (e.g., up to 1 year, subject to store policy).

## Storefront UX Decisions

- Try-on initiated from product page.
- Async flow with polling.
- Desktop target includes floating/PiP-like progressive status UX.
- Mobile fallback is simplified history access link instead of PiP.

## History Retrieval

- Use `/api/v1/try-on/history`.
- Product-specific history when `product_id` present.
- Global user history when omitted.

## Uninstall Behavior

- Keep historical DB data.
- Mark app as uninstalled in tenant record.
- Do not hard-delete on uninstall in MVP.

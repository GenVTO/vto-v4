# Product Specification

## Product Name

VTO v4 (Virtual Try-On API Platform)

## Vision

Build a modular, provider-agnostic API platform for AI virtual try-on that can be reused across multiple commercial products (Shopify app first, then additional channels and SaaS/enterprise offerings).

## Primary Business Objective (MVP)

Reduce e-commerce returns by giving shoppers a realistic virtual try-on before purchase.

## Initial Go-To-Market

- First paying/active segment: Shopify merchants.
- Strategic rationale:
  - Faster distribution than pure API-first outbound.
  - Existing potential Shopify customers available.
  - Faster feedback loop on visual quality and UX.

## Core User Journey

1. Shopper browses product page in Shopify storefront.
2. Shopper opens try-on section injected by Shopify app.
3. Shopper uploads personal photo.
4. System submits try-on job asynchronously.
5. Shopper continues browsing while jobs progress.
6. Shopper gets final generated image tied to product context.
7. Shopper can revisit product and see prior try-on (if still retained).

## Product Principles

- API-first core with modular provider gateways.
- Hide third-party provider identities from external API consumers.
- Prefer practical shipping over perfect completeness.
- Keep MVP focused on real generation flow and commercial viability.

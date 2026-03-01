/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite/client" />

interface CloudflareEnv {
  SESSION_KV: KVNamespace;
  SHOPIFY_API_KEY: string;
  SHOPIFY_API_SECRET: string;
  SHOPIFY_APP_URL: string;
  SCOPES: string;
  SHOP_CUSTOM_DOMAIN?: string;
}

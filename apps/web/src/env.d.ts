/// <reference types="astro/client" />
declare module 'react-image-magnifiers'

interface ImportMetaEnv {
  readonly PUBLIC_SHOPIFY_APP_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

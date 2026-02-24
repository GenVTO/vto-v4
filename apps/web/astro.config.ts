import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
// oxlint-disable-next-line import/default
import sentry from '@sentry/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
    sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        telemetry: false,
      },
    }),
  ],
  output: 'server',
  server: {
    host: 'localhost',
    port: 3008,
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
    plugins: [tailwindcss() as any],
  },
})

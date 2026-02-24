/// <reference types="vitest" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'

import { sharedConfig } from '../../vitest.shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const localConfig = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    coverage: {
      exclude: [...(sharedConfig.test?.coverage?.exclude || []), 'src/env.d.ts'],
    },
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    server: {
      deps: {
        inline: ['@astrojs/react'],
      },
    },
    setupFiles: ['./src/test/setup.ts'],
  },
})

export default mergeConfig(sharedConfig, localConfig)

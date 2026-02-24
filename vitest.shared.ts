import { defineConfig } from 'vitest/config'

export const sharedConfig = defineConfig({
  test: {
    coverage: {
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/dist/**',
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    env: {
      NODE_ENV: 'test',
      // Fix for Wrangler EPERM issue by redirecting config to a temp local dir
      WRANGLER_CONFIG_DIR: './.wrangler-config',
      XDG_CONFIG_HOME: './.config',
    },
    globals: true,
    passWithNoTests: true,
    watch: false,
  },
})

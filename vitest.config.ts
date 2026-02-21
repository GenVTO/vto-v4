import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    },
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    watch: false,
  },
})

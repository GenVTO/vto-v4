import { mergeConfig } from 'vitest/config'

import { sharedConfig } from './vitest.shared'

export default mergeConfig(sharedConfig, {
  test: {
    environment: 'node',
    // Removed restrictive include to allow default discovery in monorepo packages
  },
})

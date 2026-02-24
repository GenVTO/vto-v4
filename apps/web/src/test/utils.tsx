import type { RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

/**
 * Custom render function that includes global providers if needed.
 *
 * Example usage:
 * render(<MyComponent />)
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    // Add providers here (e.g. ThemeProvider, QueryClientProvider, etc.)
    <>{children}</>
  )

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

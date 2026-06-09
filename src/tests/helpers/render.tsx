import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'

// Extend this with any Providers that tests need (e.g. SessionProvider)
function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }

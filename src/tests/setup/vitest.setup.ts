import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}))

vi.mock('server-only', () => ({}))

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-mock' }),
  Geist: () => ({ variable: '--font-geist-mock', className: 'geist-mock' }),
}))

// Use clearAllMocks (not restoreAllMocks) to avoid breaking vitest-mock-extended proxies.
// Tests that use vi.spyOn must call .mockRestore() in their own afterEach.
afterEach(() => {
  vi.clearAllMocks()
})

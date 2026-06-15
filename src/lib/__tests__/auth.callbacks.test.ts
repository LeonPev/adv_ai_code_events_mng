/**
 * Unit tests for the NextAuth JWT/session callbacks.
 * The `authorize` function is tested as an integration test below (with TEST_DATABASE_URL)
 * because Vitest 4's mock registry does not intercept transitive relative imports
 * (auth.ts imports prisma via './prisma'; vi.mock('@/lib/prisma') only intercepts
 * direct imports from test files).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { testPrisma, truncateAll } from '@/tests/helpers/db'
import { authOptions } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// CredentialsProvider wraps `options.authorize` — use the inner function directly
// so it runs in isolation without NextAuth's request/CSRF context.
const authorize = (authOptions.providers[0] as unknown as {
  options: {
    authorize: (
      credentials: { email: string; password: string } | undefined,
      req: unknown
    ) => Promise<{ id: string; email: string; name: string; role: string } | null>
  }
}).options.authorize

const jwtCallback = authOptions.callbacks!.jwt! as (params: {
  token: Record<string, unknown>
  user?: unknown
}) => Promise<Record<string, unknown>>

const sessionCallback = authOptions.callbacks!.session! as (params: {
  session: { user: Record<string, unknown>; expires: string }
  token: Record<string, unknown>
  user: unknown
}) => Promise<{ user: Record<string, unknown>; expires: string }>

// ---------------------------------------------------------------------------
// authorize — integration tests using TEST_DATABASE_URL
// ---------------------------------------------------------------------------

describe('authorize (integration)', () => {
  const HASH = bcrypt.hashSync('correct123', 1) // 1 round = fast for tests

  beforeAll(async () => {
    await truncateAll()
    await testPrisma.user.create({
      data: {
        id: 'auth-test-user',
        email: 'user@test.com',
        passwordHash: HASH,
        fullName: 'Test User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    })
    await testPrisma.user.create({
      data: {
        id: 'auth-test-suspended',
        email: 'suspended@test.com',
        passwordHash: HASH,
        fullName: 'Suspended User',
        role: 'CUSTOMER',
        status: 'SUSPENDED',
      },
    })
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  it('returns null when credentials are undefined', async () => {
    expect(await authorize(undefined, {})).toBeNull()
  })

  it('returns null when email is empty', async () => {
    expect(await authorize({ email: '', password: 'pass' }, {})).toBeNull()
  })

  it('returns null when user is not found', async () => {
    expect(await authorize({ email: 'nobody@test.com', password: 'pass' }, {})).toBeNull()
  })

  it('throws a SUSPENDED error for a suspended account with correct credentials', async () => {
    await expect(authorize({ email: 'suspended@test.com', password: 'correct123' }, {}))
      .rejects.toThrow(/suspended/i)
  })

  it('returns null when password is wrong', async () => {
    expect(await authorize({ email: 'user@test.com', password: 'wrongpass' }, {})).toBeNull()
  })

  it('returns user object on valid credentials', async () => {
    const result = await authorize({ email: 'user@test.com', password: 'correct123' }, {})
    expect(result).toMatchObject({
      id: 'auth-test-user',
      email: 'user@test.com',
      name: 'Test User',
      role: 'CUSTOMER',
    })
  })

  it('never returns passwordHash in the result', async () => {
    const result = await authorize({ email: 'user@test.com', password: 'correct123' }, {})
    expect(result).not.toBeNull()
    expect(result).not.toHaveProperty('passwordHash')
  })
})

// ---------------------------------------------------------------------------
// jwt callback — pure unit tests (no DB needed)
// ---------------------------------------------------------------------------

describe('jwt callback', () => {
  it('adds role and id to token on initial sign-in', async () => {
    const user = { id: 'u-99', role: 'ADMIN' }
    const result = await jwtCallback({ token: {}, user })
    expect(result.role).toBe('ADMIN')
    expect(result.id).toBe('u-99')
  })

  it('preserves existing token fields on subsequent requests', async () => {
    const token = { role: 'OPERATOR', id: 'u-55', sub: 'u-55' }
    const result = await jwtCallback({ token })
    expect(result.role).toBe('OPERATOR')
    expect(result.id).toBe('u-55')
  })
})

// ---------------------------------------------------------------------------
// session callback — pure unit tests (no DB needed)
// ---------------------------------------------------------------------------

describe('session callback', () => {
  it('maps role and id from token to session.user', async () => {
    const session = {
      expires: new Date(Date.now() + 3_600_000).toISOString(),
      user: { name: 'Test', email: 'test@test.com', image: null },
    }
    const token = { role: 'CUSTOMER', id: 'u-42', sub: 'u-42' }
    const result = await sessionCallback({ session, token, user: null })
    expect(result.user.role).toBe('CUSTOMER')
    expect(result.user.id).toBe('u-42')
  })
})

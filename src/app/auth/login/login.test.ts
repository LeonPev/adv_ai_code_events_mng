import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { testPrisma } from '@/tests/helpers/db'

const authorize = (
  authOptions.providers[0] as {
    options: { authorize: (c: Record<string, string> | undefined) => Promise<unknown> }
  }
).options.authorize

// Unique email namespace so this file doesn't conflict with auth.callbacks.test.ts
const USERS = {
  customer:  { email: 'ltest.customer@login.test',  role: 'CUSTOMER', fullName: 'Login Test Customer',  status: 'ACTIVE' },
  operator:  { email: 'ltest.operator@login.test',  role: 'OPERATOR', fullName: 'Login Test Operator',  status: 'ACTIVE' },
  admin:     { email: 'ltest.admin@login.test',     role: 'ADMIN',    fullName: 'Login Test Admin',      status: 'ACTIVE' },
  suspended: { email: 'ltest.suspended@login.test', role: 'CUSTOMER', fullName: 'Login Test Suspended',  status: 'SUSPENDED' },
}

describe('authorize (integration)', () => {
  let hash: string

  beforeAll(async () => {
    // Compute once; reused by beforeEach upserts
    hash = await bcrypt.hash('correct123', 1)
  })

  // Upsert before every test so this file survives truncateAll() from other test files
  // running in parallel forks (auth.callbacks.test.ts calls truncateAll in afterAll).
  beforeEach(async () => {
    for (const u of Object.values(USERS)) {
      await testPrisma.user.upsert({
        where:  { email: u.email },
        create: { email: u.email, passwordHash: hash, fullName: u.fullName, role: u.role, status: u.status },
        update: {},
      })
    }
  })

  afterAll(async () => {
    await testPrisma.user.deleteMany({ where: { email: { in: Object.values(USERS).map(u => u.email) } } })
    await testPrisma.$disconnect()
  })

  it('returns a user object for valid ACTIVE credentials', async () => {
    const result = await authorize({ email: USERS.customer.email, password: 'correct123' }) as Record<string, unknown>
    expect(result).toMatchObject({ email: USERS.customer.email, name: USERS.customer.fullName, role: 'CUSTOMER' })
    expect(result.id).toBeDefined()
  })

  it('returns null for a wrong password', async () => {
    expect(await authorize({ email: USERS.customer.email, password: 'wrongpass' })).toBeNull()
  })

  it('returns null for a non-existent email', async () => {
    expect(await authorize({ email: 'nobody@login.test', password: 'correct123' })).toBeNull()
  })

  it('returns null when email is an empty string', async () => {
    expect(await authorize({ email: '', password: 'correct123' })).toBeNull()
  })

  it('returns null when password is an empty string', async () => {
    expect(await authorize({ email: USERS.customer.email, password: '' })).toBeNull()
  })

  it('returns null when credentials are undefined', async () => {
    expect(await authorize(undefined)).toBeNull()
  })

  it('throws a suspended-account error for a SUSPENDED user with correct credentials', async () => {
    await expect(
      authorize({ email: USERS.suspended.email, password: 'correct123' })
    ).rejects.toThrow(/suspended/i)
  })

  it.each([
    [USERS.customer.email, 'CUSTOMER'],
    [USERS.operator.email, 'OPERATOR'],
    [USERS.admin.email,    'ADMIN'],
  ] as const)('includes role %s in the returned object', async (email, expectedRole) => {
    const result = await authorize({ email, password: 'correct123' }) as { role: string }
    expect(result.role).toBe(expectedRole)
  })
})

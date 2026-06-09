import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { testPrisma, truncateAll } from '@/tests/helpers/db'

const authorize = (
  authOptions.providers[0] as {
    options: { authorize: (c: Record<string, string> | undefined) => Promise<unknown> }
  }
).options.authorize

describe('authorize (integration)', () => {
  beforeEach(async () => {
    await truncateAll()

    const hash = await bcrypt.hash('correct123', 1)

    await testPrisma.user.create({
      data: { email: 'customer@test.com', passwordHash: hash, fullName: 'Active Customer', role: 'CUSTOMER', status: 'ACTIVE' },
    })
    await testPrisma.user.create({
      data: { email: 'operator@test.com', passwordHash: hash, fullName: 'Active Operator', role: 'OPERATOR', status: 'ACTIVE' },
    })
    await testPrisma.user.create({
      data: { email: 'admin@test.com', passwordHash: hash, fullName: 'Active Admin', role: 'ADMIN', status: 'ACTIVE' },
    })
    await testPrisma.user.create({
      data: { email: 'suspended@test.com', passwordHash: hash, fullName: 'Suspended User', role: 'CUSTOMER', status: 'SUSPENDED' },
    })
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  it('returns a user object for valid ACTIVE credentials', async () => {
    const result = await authorize({ email: 'customer@test.com', password: 'correct123' }) as Record<string, unknown>
    expect(result).toMatchObject({ email: 'customer@test.com', name: 'Active Customer', role: 'CUSTOMER' })
    expect(result.id).toBeDefined()
  })

  it('returns null for a wrong password', async () => {
    const result = await authorize({ email: 'customer@test.com', password: 'wrongpass' })
    expect(result).toBeNull()
  })

  it('returns null for a non-existent email', async () => {
    const result = await authorize({ email: 'nobody@test.com', password: 'correct123' })
    expect(result).toBeNull()
  })

  it('returns null when email is an empty string', async () => {
    const result = await authorize({ email: '', password: 'correct123' })
    expect(result).toBeNull()
  })

  it('returns null when password is an empty string', async () => {
    const result = await authorize({ email: 'customer@test.com', password: '' })
    expect(result).toBeNull()
  })

  it('returns null when credentials are undefined', async () => {
    const result = await authorize(undefined)
    expect(result).toBeNull()
  })

  // Fails on current implementation: returns null instead of throwing for SUSPENDED
  it('throws a suspended-account error for a SUSPENDED user with correct credentials', async () => {
    await expect(
      authorize({ email: 'suspended@test.com', password: 'correct123' })
    ).rejects.toThrow(/suspended/i)
  })

  it.each([
    ['customer@test.com', 'CUSTOMER'],
    ['operator@test.com', 'OPERATOR'],
    ['admin@test.com', 'ADMIN'],
  ] as const)('includes role %s in the returned object for %s', async (email, expectedRole) => {
    const result = await authorize({ email, password: 'correct123' }) as { role: string }
    expect(result.role).toBe(expectedRole)
  })
})

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { testPrisma, truncateAll } from '@/tests/helpers/db'
import { signUpAction } from './actions'

describe('signUpAction (integration)', () => {
  beforeEach(async () => {
    await truncateAll()
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  it('creates a CUSTOMER user with a bcrypt-hashed password', async () => {
    const fd = new FormData()
    fd.set('fullName', 'Tamar Cohen')
    fd.set('email', 'tamar@example.com')
    fd.set('password', 'securepass')

    const result = await signUpAction(fd)

    expect(result).toEqual({ success: true })

    const user = await testPrisma.user.findUnique({ where: { email: 'tamar@example.com' } })
    expect(user).not.toBeNull()
    expect(user!.role).toBe('CUSTOMER')
    expect(user!.status).toBe('ACTIVE')
    expect(user!.fullName).toBe('Tamar Cohen')
    expect(user!.passwordHash).toMatch(/^\$2/)
    expect(await bcrypt.compare('securepass', user!.passwordHash)).toBe(true)
  })

  it('never stores the plaintext password', async () => {
    const fd = new FormData()
    fd.set('fullName', 'Tamar Cohen')
    fd.set('email', 'tamar@example.com')
    fd.set('password', 'securepass')

    await signUpAction(fd)

    const user = await testPrisma.user.findUnique({ where: { email: 'tamar@example.com' } })
    expect(user!.passwordHash).not.toBe('securepass')
  })

  it('returns an error for duplicate email without creating a second row', async () => {
    const makeForm = () => {
      const fd = new FormData()
      fd.set('fullName', 'Tamar Cohen')
      fd.set('email', 'tamar@example.com')
      fd.set('password', 'securepass')
      return fd
    }

    await signUpAction(makeForm())
    const result = await signUpAction(makeForm())

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toMatch(/already exists/i)

    const count = await testPrisma.user.count({ where: { email: 'tamar@example.com' } })
    expect(count).toBe(1)
  })

  it('returns an error when password is shorter than 8 characters', async () => {
    const fd = new FormData()
    fd.set('fullName', 'Short Pass')
    fd.set('email', 'short@example.com')
    fd.set('password', 'abc')

    const result = await signUpAction(fd)

    expect(result).toHaveProperty('error')
    const count = await testPrisma.user.count({ where: { email: 'short@example.com' } })
    expect(count).toBe(0)
  })

  it('returns an error when full name is missing', async () => {
    const fd = new FormData()
    fd.set('fullName', '')
    fd.set('email', 'noname@example.com')
    fd.set('password', 'securepass')

    const result = await signUpAction(fd)

    expect(result).toHaveProperty('error')
  })
})

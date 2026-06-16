import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { testPrisma, truncateAll, seedMinimal } from '@/tests/helpers/db'
import { sessionAs } from '@/tests/helpers/session'

vi.mock('@/lib/auth')

import { getServerSession } from '@/lib/auth'
import { registerForActivity } from './actions'

// All tests act as an admin registering an explicit customer id on-behalf-of — this
// exercises the same transaction/capacity/qrToken logic as customer self-registration
// without depending on the session-mock's fixed user id matching the seeded customer.
describe('registerForActivity (T-11 / T-26)', () => {
  beforeEach(async () => {
    await truncateAll()
    vi.mocked(getServerSession).mockReset()
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  it('rejects an unauthenticated caller', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const { activity, customer } = await seedMinimal()

    const result = await registerForActivity(activity.id, customer.id)
    expect(result).toHaveProperty('error')
  })

  it('creates a registration and generates a 64-char hex qrToken for an EVENT', async () => {
    const { activity, customer } = await seedMinimal({ activityType: 'EVENT' })
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    const result = await registerForActivity(activity.id, customer.id)
    expect(result).toHaveProperty('success', true)

    const registration = await testPrisma.registration.findFirst({ where: { activityId: activity.id } })
    expect(registration?.qrToken).toMatch(/^[0-9a-f]{64}$/)
  })

  it('leaves qrToken null for a SEMINAR registration', async () => {
    const { activity, customer } = await seedMinimal({ activityType: 'SEMINAR' })
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    const result = await registerForActivity(activity.id, customer.id)
    expect(result).toHaveProperty('success', true)

    const registration = await testPrisma.registration.findFirst({ where: { activityId: activity.id } })
    expect(registration?.qrToken).toBeNull()
  })

  it('rejects a duplicate registration for the same activity (BR-04)', async () => {
    const { activity, customer } = await seedMinimal()
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    await registerForActivity(activity.id, customer.id)
    const second = await registerForActivity(activity.id, customer.id)

    expect(second).toHaveProperty('error')
    const count = await testPrisma.registration.count({ where: { activityId: activity.id } })
    expect(count).toBe(1)
  })

  it('rejects registration once the activity is full (BR-01)', async () => {
    const { activity, customer } = await seedMinimal({ activityCapacity: 1 })
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    const filler = await testPrisma.user.create({
      data: { email: 'filler@register.test', passwordHash: 'x', fullName: 'Filler', role: 'CUSTOMER' },
    })
    await testPrisma.registration.create({ data: { customerId: filler.id, activityId: activity.id } })

    const result = await registerForActivity(activity.id, customer.id)
    expect(result).toHaveProperty('error')
    if ('error' in result) expect(result.error).toMatch(/full/i)
  })

  it('only one registration succeeds when two requests race for the last spot (§15)', async () => {
    const { activity } = await seedMinimal({ activityCapacity: 1 })
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    const customerA = await testPrisma.user.create({
      data: { email: 'race-a@register.test', passwordHash: 'x', fullName: 'Race A', role: 'CUSTOMER' },
    })
    const customerB = await testPrisma.user.create({
      data: { email: 'race-b@register.test', passwordHash: 'x', fullName: 'Race B', role: 'CUSTOMER' },
    })

    const [resultA, resultB] = await Promise.all([
      registerForActivity(activity.id, customerA.id),
      registerForActivity(activity.id, customerB.id),
    ])

    const successes = [resultA, resultB].filter((r) => 'success' in r)
    expect(successes).toHaveLength(1)

    const count = await testPrisma.registration.count({ where: { activityId: activity.id, status: 'ACTIVE' } })
    expect(count).toBe(1)
  })

  it('writes one audit log row per successful registration (T-27)', async () => {
    const { activity, customer } = await seedMinimal()
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())

    await registerForActivity(activity.id, customer.id)

    const logs = await testPrisma.auditLog.findMany({ where: { action: 'REGISTRATION_CREATED' } })
    expect(logs).toHaveLength(1)
  })
})

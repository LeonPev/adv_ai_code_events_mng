import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { testPrisma, truncateAll, seedMinimal } from '@/tests/helpers/db'
import { sessionAs } from '@/tests/helpers/session'

vi.mock('@/lib/auth')

import { getServerSession } from '@/lib/auth'
import { cancelActivity } from './actions'

describe('cancelActivity (T-08 cascade / T-27 audit log)', () => {
  beforeEach(async () => {
    await truncateAll()
    vi.mocked(getServerSession).mockReset()
    vi.mocked(getServerSession).mockResolvedValue(sessionAs.admin())
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  it('cancels the activity and bulk-cancels active registrations, writing one audit row each', async () => {
    const { activity } = await seedMinimal({ activityCapacity: 5 })

    const customers = await Promise.all(
      [1, 2, 3].map((n) =>
        testPrisma.user.create({
          data: { email: `cust${n}@cancelactivity.test`, passwordHash: 'x', fullName: `C${n}`, role: 'CUSTOMER' },
        })
      )
    )
    await Promise.all(
      customers.map((c) => testPrisma.registration.create({ data: { customerId: c.id, activityId: activity.id } }))
    )

    // Caught because cancelActivity redirects (throws NEXT_REDIRECT) on success.
    await cancelActivity(activity.id).catch(() => {})

    const updated = await testPrisma.activity.findUnique({ where: { id: activity.id } })
    expect(updated?.status).toBe('CANCELLED')

    const registrations = await testPrisma.registration.findMany({ where: { activityId: activity.id } })
    expect(registrations).toHaveLength(3)
    expect(registrations.every((r) => r.status === 'CANCELLED')).toBe(true)

    const logs = await testPrisma.auditLog.findMany({ where: { action: 'REGISTRATION_CANCELLED' } })
    expect(logs).toHaveLength(3)
  })

  it('does not affect registrations that were already cancelled', async () => {
    const { activity, customer } = await seedMinimal()
    await testPrisma.registration.create({
      data: { customerId: customer.id, activityId: activity.id, status: 'CANCELLED' },
    })

    await cancelActivity(activity.id).catch(() => {})

    const logs = await testPrisma.auditLog.findMany({ where: { action: 'REGISTRATION_CANCELLED' } })
    expect(logs).toHaveLength(0)
  })
})

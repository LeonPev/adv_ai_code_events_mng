import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { testPrisma, truncateAll } from '@/tests/helpers/db'
import { checkInByQrToken } from './checkin'

describe('checkInByQrToken (§11.1 / §11.2 / BR-11, T-16/T-28)', () => {
  let operatorId: string
  let eventId: string
  let otherEventId: string

  beforeEach(async () => {
    await truncateAll()

    const admin = await testPrisma.user.create({
      data: { email: 'admin@checkin.test', passwordHash: 'x', fullName: 'Admin', role: 'ADMIN' },
    })
    const operator = await testPrisma.user.create({
      data: { email: 'operator@checkin.test', passwordHash: 'x', fullName: 'Operator', role: 'OPERATOR' },
    })
    operatorId = operator.id

    const room = await testPrisma.room.create({ data: { name: 'Room', type: 'CLASSROOM', capacity: 10 } })

    const event = await testPrisma.activity.create({
      data: {
        name: 'Concert',
        type: 'EVENT',
        description: 'd',
        roomId: room.id,
        capacity: 10,
        status: 'PUBLISHED',
        startDatetime: new Date(),
        endDatetime: new Date(Date.now() + 3_600_000),
        createdById: admin.id,
      },
    })
    eventId = event.id

    const otherEvent = await testPrisma.activity.create({
      data: {
        name: 'Other Event',
        type: 'EVENT',
        description: 'd',
        roomId: room.id,
        capacity: 10,
        status: 'PUBLISHED',
        startDatetime: new Date(),
        endDatetime: new Date(Date.now() + 3_600_000),
        createdById: admin.id,
      },
    })
    otherEventId = otherEvent.id
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  async function createRegistration(opts: { activityId: string; status?: string; qrToken?: string }) {
    const customer = await testPrisma.user.create({
      data: {
        email: `customer-${Math.random()}@checkin.test`,
        passwordHash: 'x',
        fullName: 'Customer',
        role: 'CUSTOMER',
      },
    })
    return testPrisma.registration.create({
      data: {
        customerId: customer.id,
        activityId: opts.activityId,
        status: opts.status ?? 'ACTIVE',
        qrToken: opts.qrToken ?? `token-${Math.random()}`,
      },
    })
  }

  it('rejects an unrecognized token', async () => {
    const result = await checkInByQrToken('does-not-exist', eventId, operatorId)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('INVALID_TOKEN')
  })

  it('rejects a token registered for a different event', async () => {
    const reg = await createRegistration({ activityId: otherEventId, qrToken: 'wrong-event-token' })
    const result = await checkInByQrToken(reg.qrToken!, eventId, operatorId)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('WRONG_EVENT')
  })

  it('rejects a cancelled registration', async () => {
    const reg = await createRegistration({ activityId: eventId, status: 'CANCELLED', qrToken: 'cancelled-token' })
    const result = await checkInByQrToken(reg.qrToken!, eventId, operatorId)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('NOT_ACTIVE')
  })

  it('accepts a valid active registration and creates an AttendanceRecord', async () => {
    const reg = await createRegistration({ activityId: eventId, qrToken: 'valid-token' })
    const result = await checkInByQrToken(reg.qrToken!, eventId, operatorId)
    expect(result.ok).toBe(true)

    const attendance = await testPrisma.attendanceRecord.findUnique({ where: { registrationId: reg.id } })
    expect(attendance).not.toBeNull()
    expect(attendance?.checkedInById).toBe(operatorId)
  })

  it('BR-11: rejects a second scan of the same token with the existing check-in time', async () => {
    const reg = await createRegistration({ activityId: eventId, qrToken: 'rescan-token' })
    await checkInByQrToken(reg.qrToken!, eventId, operatorId)

    const second = await checkInByQrToken(reg.qrToken!, eventId, operatorId)
    expect(second.ok).toBe(false)
    if (!second.ok) {
      expect(second.reason).toBe('ALREADY_CHECKED_IN')
      expect(second.message).toMatch(/already checked in/i)
    }

    const count = await testPrisma.attendanceRecord.count({ where: { registrationId: reg.id } })
    expect(count).toBe(1)
  })

  it('rejects check-in for a cancelled event (EC-03)', async () => {
    await testPrisma.activity.update({ where: { id: eventId }, data: { status: 'CANCELLED' } })
    const reg = await createRegistration({ activityId: eventId, qrToken: 'cancelled-event-token' })

    const result = await checkInByQrToken(reg.qrToken!, eventId, operatorId)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('EVENT_CANCELLED')
  })
})

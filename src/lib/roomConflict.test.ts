import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { testPrisma, truncateAll } from '@/tests/helpers/db'
import { findRoomConflict } from './roomConflict'

describe('findRoomConflict (BR-12 overlap matrix, T-25)', () => {
  let roomId: string
  let adminId: string

  beforeEach(async () => {
    await truncateAll()
    const admin = await testPrisma.user.create({
      data: { email: 'admin@conflict.test', passwordHash: 'x', fullName: 'Admin', role: 'ADMIN' },
    })
    adminId = admin.id
    const room = await testPrisma.room.create({
      data: { name: 'Conflict Room', type: 'CLASSROOM', capacity: 10 },
    })
    roomId = room.id
  })

  afterAll(async () => {
    await truncateAll()
    await testPrisma.$disconnect()
  })

  async function createActivity(opts: {
    start: Date
    end: Date
    status?: string
    name?: string
  }) {
    return testPrisma.activity.create({
      data: {
        name: opts.name ?? 'Existing Activity',
        type: 'SEMINAR',
        description: 'd',
        roomId,
        capacity: 10,
        status: opts.status ?? 'PUBLISHED',
        startDatetime: opts.start,
        endDatetime: opts.end,
        createdById: adminId,
      },
    })
  }

  it('allows back-to-back bookings (10:00–11:00 then 11:00–12:00)', async () => {
    await createActivity({ start: new Date('2030-01-01T10:00:00Z'), end: new Date('2030-01-01T11:00:00Z') })

    const conflict = await findRoomConflict({
      roomId,
      start: new Date('2030-01-01T11:00:00Z'),
      end: new Date('2030-01-01T12:00:00Z'),
    })

    expect(conflict).toBeNull()
  })

  it('blocks overlapping bookings and names the conflicting activity', async () => {
    await createActivity({
      start: new Date('2030-01-01T10:00:00Z'),
      end: new Date('2030-01-01T11:00:00Z'),
      name: 'Pottery Class',
    })

    const conflict = await findRoomConflict({
      roomId,
      start: new Date('2030-01-01T10:30:00Z'),
      end: new Date('2030-01-01T11:30:00Z'),
    })

    expect(conflict).not.toBeNull()
    expect(conflict?.name).toBe('Pottery Class')
  })

  it('excludes CANCELLED activities from the conflict check', async () => {
    await createActivity({
      start: new Date('2030-01-01T10:00:00Z'),
      end: new Date('2030-01-01T11:00:00Z'),
      status: 'CANCELLED',
    })

    const conflict = await findRoomConflict({
      roomId,
      start: new Date('2030-01-01T10:30:00Z'),
      end: new Date('2030-01-01T11:30:00Z'),
    })

    expect(conflict).toBeNull()
  })

  it('excludes the activity being edited from conflicting with itself', async () => {
    const activity = await createActivity({
      start: new Date('2030-01-01T10:00:00Z'),
      end: new Date('2030-01-01T11:00:00Z'),
    })

    const conflict = await findRoomConflict({
      roomId,
      start: new Date('2030-01-01T10:00:00Z'),
      end: new Date('2030-01-01T11:00:00Z'),
      excludeActivityId: activity.id,
    })

    expect(conflict).toBeNull()
  })
})

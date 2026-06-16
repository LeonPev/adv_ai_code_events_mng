import { PrismaClient } from '@prisma/client'

// Dedicated client for test setup/teardown; DATABASE_URL is injected from TEST_DATABASE_URL.
export const testPrisma = new PrismaClient()

// Delete rows in FK-safe order (children before parents)
export async function truncateAll() {
  await testPrisma.auditLog.deleteMany()
  await testPrisma.attendanceRecord.deleteMany()
  await testPrisma.registration.deleteMany()
  await testPrisma.courseSession.deleteMany()
  await testPrisma.activity.deleteMany()
  await testPrisma.room.deleteMany()
  await testPrisma.account.deleteMany()
  await testPrisma.session.deleteMany()
  await testPrisma.verificationToken.deleteMany()
  await testPrisma.user.deleteMany()
}

export interface SeedOptions {
  activityType?: 'EVENT' | 'SEMINAR' | 'COURSE'
  activityStatus?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  activityCapacity?: number
  startOffsetMs?: number // ms from now; defaults to +1 day
}

export async function seedMinimal(opts: SeedOptions = {}) {
  const {
    activityType = 'EVENT',
    activityStatus = 'PUBLISHED',
    activityCapacity = 10,
    startOffsetMs = 86_400_000,
  } = opts

  const bcrypt = await import('bcryptjs')

  const admin = await testPrisma.user.create({
    data: {
      id: 'test-admin-id',
      email: 'admin@ccms.local',
      passwordHash: bcrypt.hashSync('admin123', 1),
      fullName: 'Test Admin',
      role: 'ADMIN',
    },
  })

  const customer = await testPrisma.user.create({
    data: {
      id: 'test-customer-id',
      email: 'customer@ccms.local',
      passwordHash: bcrypt.hashSync('cust123', 1),
      fullName: 'Test Customer',
      role: 'CUSTOMER',
    },
  })

  const room = await testPrisma.room.create({
    data: {
      id: 'test-room-id',
      name: 'Test Room',
      type: 'CLASSROOM',
      capacity: 50,
    },
  })

  const now = new Date()
  const start = new Date(now.getTime() + startOffsetMs)
  const end = new Date(start.getTime() + 3_600_000)

  const activity = await testPrisma.activity.create({
    data: {
      id: 'test-activity-id',
      name: 'Test Activity',
      type: activityType,
      description: 'A test activity',
      roomId: room.id,
      capacity: activityCapacity,
      status: activityStatus,
      startDatetime: activityType !== 'COURSE' ? start : undefined,
      endDatetime: activityType !== 'COURSE' ? end : undefined,
      createdById: admin.id,
    },
  })

  return { admin, customer, room, activity }
}

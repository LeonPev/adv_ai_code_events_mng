import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

// Direct DB access for E2E test data setup — separate client from app's singleton
const db = new PrismaClient({
  datasources: { db: { url: 'file:./test.db' } },
})

export async function createTestRegistration(opts: {
  customerId: string
  activityId: string
  withQr?: boolean
}) {
  const qrToken = opts.withQr ? crypto.randomBytes(32).toString('hex') : undefined
  return db.registration.create({
    data: {
      customerId: opts.customerId,
      activityId: opts.activityId,
      status: 'ACTIVE',
      qrToken,
    },
  })
}

export async function getRegistration(id: string) {
  return db.registration.findUnique({ where: { id } })
}

export async function cleanupRegistrations(activityId: string) {
  await db.attendanceRecord.deleteMany({ where: { eventId: activityId } })
  await db.registration.deleteMany({ where: { activityId } })
}

export { db as testDb }

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Users
  const adminHash = await bcrypt.hash("admin123", 10)
  const operatorHash = await bcrypt.hash("op123", 10)
  const customerHash = await bcrypt.hash("cust123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@ccms.local" },
    update: {},
    create: {
      email: "admin@ccms.local",
      passwordHash: adminHash,
      fullName: "Hadas Admin",
      role: "ADMIN",
    },
  })

  const operator = await prisma.user.upsert({
    where: { email: "operator@ccms.local" },
    update: {},
    create: {
      email: "operator@ccms.local",
      passwordHash: operatorHash,
      fullName: "Yossi Operator",
      role: "OPERATOR",
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: "customer@ccms.local" },
    update: {},
    create: {
      email: "customer@ccms.local",
      passwordHash: customerHash,
      fullName: "Maya Customer",
      role: "CUSTOMER",
    },
  })

  // Rooms
  const classroom = await prisma.room.upsert({
    where: { id: "room-classroom-1" },
    update: {},
    create: {
      id: "room-classroom-1",
      name: "Room A",
      type: "CLASSROOM",
      capacity: 30,
      description: "Standard classroom with whiteboard",
    },
  })

  const artStudio = await prisma.room.upsert({
    where: { id: "room-art-1" },
    update: {},
    create: {
      id: "room-art-1",
      name: "Art Studio",
      type: "ART_STUDIO",
      capacity: 20,
      description: "Art supplies and sink",
    },
  })

  const auditorium = await prisma.room.upsert({
    where: { id: "room-auditorium-1" },
    update: {},
    create: {
      id: "room-auditorium-1",
      name: "Main Auditorium",
      type: "AUDITORIUM",
      capacity: 200,
      description: "Stage and A/V equipment",
    },
  })

  // Activities
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  const dayAfter = new Date(now.getTime() + 2 * 86400000)

  const event = await prisma.activity.upsert({
    where: { id: "activity-event-1" },
    update: {},
    create: {
      id: "activity-event-1",
      name: "Summer Concert",
      type: "EVENT",
      description: "An evening of live music featuring local artists.",
      roomId: auditorium.id,
      capacity: 150,
      status: "PUBLISHED",
      startDatetime: tomorrow,
      endDatetime: new Date(tomorrow.getTime() + 3 * 3600000),
      createdById: admin.id,
    },
  })

  const seminar = await prisma.activity.upsert({
    where: { id: "activity-seminar-1" },
    update: {},
    create: {
      id: "activity-seminar-1",
      name: "Intro to Watercolor",
      type: "SEMINAR",
      description: "A one-day watercolor workshop for beginners.",
      roomId: artStudio.id,
      capacity: 15,
      status: "PUBLISHED",
      startDatetime: dayAfter,
      endDatetime: new Date(dayAfter.getTime() + 4 * 3600000),
      createdById: admin.id,
    },
  })

  const course = await prisma.activity.upsert({
    where: { id: "activity-course-1" },
    update: {},
    create: {
      id: "activity-course-1",
      name: "Digital Photography",
      type: "COURSE",
      description: "8-session course covering camera basics to post-processing.",
      roomId: classroom.id,
      capacity: 20,
      status: "PUBLISHED",
      createdById: admin.id,
    },
  })

  // Course sessions
  await prisma.courseSession.upsert({
    where: { id: "session-1" },
    update: {},
    create: {
      id: "session-1",
      courseId: course.id,
      sessionNumber: 1,
      startDatetime: new Date(now.getTime() + 7 * 86400000),
      endDatetime: new Date(now.getTime() + 7 * 86400000 + 2 * 3600000),
      roomId: classroom.id,
    },
  })

  await prisma.courseSession.upsert({
    where: { id: "session-2" },
    update: {},
    create: {
      id: "session-2",
      courseId: course.id,
      sessionNumber: 2,
      startDatetime: new Date(now.getTime() + 14 * 86400000),
      endDatetime: new Date(now.getTime() + 14 * 86400000 + 2 * 3600000),
      roomId: classroom.id,
    },
  })

  // Registration (customer → event, with QR token)
  const qrToken = crypto.randomBytes(32).toString("hex")
  await prisma.registration.upsert({
    where: { id: "reg-1" },
    update: {},
    create: {
      id: "reg-1",
      customerId: customer.id,
      activityId: event.id,
      status: "ACTIVE",
      qrToken,
    },
  })

  console.log("Seed complete.")
  console.log("\nTest credentials:")
  console.log("  Admin:    admin@ccms.local / admin123")
  console.log("  Operator: operator@ccms.local / op123")
  console.log("  Customer: customer@ccms.local / cust123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

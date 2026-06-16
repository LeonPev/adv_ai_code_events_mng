"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { findRoomConflict, formatConflictError } from "@/lib/roomConflict"
import { writeAuditLog } from "@/lib/audit"

type ActionResult = { error: string } | { success: true }

async function requireAdmin() {
  const session = await getServerSession()
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden")
  return session
}

interface ParsedActivityForm {
  name: string
  type: string
  description: string
  capacity: number
  pricePlaceholder: number | null
  roomId: string
  status: string
  startDatetime: Date | null
  endDatetime: Date | null
}

type ParsedResult = { ok: false; error: string } | { ok: true; data: ParsedActivityForm }

function parseActivityForm(formData: FormData): ParsedResult {
  const name = (formData.get("name") as string)?.trim()
  const type = formData.get("type") as string
  const description = (formData.get("description") as string)?.trim()
  const capacity = Number(formData.get("capacity"))
  const priceRaw = formData.get("pricePlaceholder") as string
  const pricePlaceholder = priceRaw ? Number(priceRaw) : null
  const roomId = formData.get("roomId") as string
  const status = (formData.get("status") as string) || "DRAFT"
  const startRaw = formData.get("startDatetime") as string
  const endRaw = formData.get("endDatetime") as string

  if (!name) return { ok: false, error: "Name is required." }
  if (!["EVENT", "SEMINAR", "COURSE"].includes(type)) return { ok: false, error: "Invalid activity type." }
  if (!description) return { ok: false, error: "Description is required." }
  if (!Number.isFinite(capacity) || capacity <= 0) return { ok: false, error: "Capacity must be a positive number." }
  if (!roomId) return { ok: false, error: "Room is required." }
  if (!["DRAFT", "PUBLISHED"].includes(status)) return { ok: false, error: "Invalid status." }

  let startDatetime: Date | null = null
  let endDatetime: Date | null = null

  if (type !== "COURSE") {
    if (!startRaw || !endRaw) return { ok: false, error: "Start and end date/time are required." }
    startDatetime = new Date(startRaw)
    endDatetime = new Date(endRaw)
    if (endDatetime <= startDatetime) return { ok: false, error: "End time must be after start time." }
  }

  return {
    ok: true,
    data: { name, type, description, capacity, pricePlaceholder, roomId, status, startDatetime, endDatetime },
  }
}

export async function createActivity(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin()
  const parsed = parseActivityForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  if (data.type === "COURSE" && data.status === "PUBLISHED") {
    return { error: "A course must have at least one session before it can be published." }
  }

  if (data.type !== "COURSE" && data.startDatetime && data.endDatetime) {
    const conflict = await findRoomConflict({
      roomId: data.roomId,
      start: data.startDatetime,
      end: data.endDatetime,
    })
    if (conflict) return { error: formatConflictError(conflict) }
  }

  const activity = await prisma.activity.create({
    data: { ...data, createdById: session.user.id },
  })

  redirect(`/admin/activities/${activity.id}`)
}

export async function updateActivity(
  activityId: string,
  expectedUpdatedAt: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseActivityForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  const current = await prisma.activity.findUnique({ where: { id: activityId } })
  if (!current) return { error: "Activity not found." }

  if (current.updatedAt.toISOString() !== expectedUpdatedAt) {
    return {
      error: `This activity was modified by someone else at ${current.updatedAt.toLocaleString()}. Reload to see the latest changes.`,
    }
  }

  if (data.type !== "COURSE" && data.startDatetime && data.endDatetime) {
    const conflict = await findRoomConflict({
      roomId: data.roomId,
      start: data.startDatetime,
      end: data.endDatetime,
      excludeActivityId: activityId,
    })
    if (conflict) return { error: formatConflictError(conflict) }
  }

  await prisma.activity.update({ where: { id: activityId }, data })
  redirect(`/admin/activities/${activityId}`)
}

export async function publishActivity(activityId: string): Promise<ActionResult> {
  await requireAdmin()
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { _count: { select: { sessions: true } } },
  })
  if (!activity) return { error: "Activity not found." }

  if (activity.type === "COURSE" && activity._count.sessions === 0) {
    return { error: "A course must have at least one session before it can be published." }
  }

  await prisma.activity.update({ where: { id: activityId }, data: { status: "PUBLISHED" } })
  return { success: true }
}

export async function cancelActivity(activityId: string): Promise<ActionResult> {
  const session = await requireAdmin()

  await prisma.$transaction(async (tx) => {
    const activeRegistrations = await tx.registration.findMany({
      where: { activityId, status: "ACTIVE" },
      select: { id: true },
    })

    await tx.activity.update({ where: { id: activityId }, data: { status: "CANCELLED" } })
    await tx.registration.updateMany({
      where: { activityId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    })

    for (const reg of activeRegistrations) {
      await writeAuditLog(tx, {
        action: "REGISTRATION_CANCELLED",
        actorId: session.user.id,
        targetId: reg.id,
        targetType: "Registration",
        metadata: { reason: "activity_cancelled", activityId },
      })
    }
  })

  redirect("/admin/activities")
}

// --- Course sessions ---

function parseSessionForm(formData: FormData) {
  const sessionNumber = Number(formData.get("sessionNumber"))
  const roomId = formData.get("roomId") as string
  const startRaw = formData.get("startDatetime") as string
  const endRaw = formData.get("endDatetime") as string

  if (!Number.isFinite(sessionNumber) || sessionNumber <= 0) {
    return { ok: false as const, error: "Session number must be a positive number." }
  }
  if (!roomId) return { ok: false as const, error: "Room is required." }
  if (!startRaw || !endRaw) return { ok: false as const, error: "Start and end date/time are required." }

  const startDatetime = new Date(startRaw)
  const endDatetime = new Date(endRaw)
  if (endDatetime <= startDatetime) return { ok: false as const, error: "End time must be after start time." }

  return { ok: true as const, data: { sessionNumber, roomId, startDatetime, endDatetime } }
}

export async function addCourseSession(courseId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseSessionForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  const conflict = await findRoomConflict({
    roomId: data.roomId,
    start: data.startDatetime,
    end: data.endDatetime,
  })
  if (conflict) return { error: formatConflictError(conflict) }

  await prisma.courseSession.create({ data: { ...data, courseId } })
  return { success: true }
}

export async function updateCourseSession(
  sessionId: string,
  courseId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseSessionForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  const conflict = await findRoomConflict({
    roomId: data.roomId,
    start: data.startDatetime,
    end: data.endDatetime,
    excludeSessionId: sessionId,
  })
  if (conflict) return { error: formatConflictError(conflict) }

  await prisma.courseSession.update({ where: { id: sessionId }, data })
  void courseId
  return { success: true }
}

export async function deleteCourseSession(sessionId: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.courseSession.delete({ where: { id: sessionId } })
  return { success: true }
}

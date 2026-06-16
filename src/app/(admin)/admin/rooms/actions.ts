"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"

type ActionResult = { error: string } | { success: true }

type ParsedRoomForm =
  | { ok: false; error: string }
  | { ok: true; data: { name: string; type: string; capacity: number; description: string | null } }

function parseRoomForm(formData: FormData): ParsedRoomForm {
  const name = (formData.get("name") as string)?.trim()
  const type = formData.get("type") as string
  const capacity = Number(formData.get("capacity"))
  const description = (formData.get("description") as string)?.trim() || null

  if (!name) return { ok: false, error: "Room name is required." }
  if (!["CLASSROOM", "ART_STUDIO", "AUDITORIUM"].includes(type)) {
    return { ok: false, error: "Please select a valid room type." }
  }
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { ok: false, error: "Capacity must be a positive number." }
  }

  return { ok: true, data: { name, type, capacity, description } }
}

async function requireAdmin() {
  const session = await getServerSession()
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }
  return session
}

export async function createRoom(formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseRoomForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  const existing = await prisma.room.findFirst({ where: { name: data.name } })
  if (existing) return { error: "A room with this name already exists." }

  await prisma.room.create({ data })

  redirect(`/admin/rooms`)
  return { success: true }
}

export async function updateRoom(roomId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseRoomForm(formData)
  if (!parsed.ok) return { error: parsed.error }
  const { data } = parsed

  const existing = await prisma.room.findFirst({
    where: { name: data.name, id: { not: roomId } },
  })
  if (existing) return { error: "A room with this name already exists." }

  await prisma.room.update({ where: { id: roomId }, data })

  redirect(`/admin/rooms`)
  return { success: true }
}

export async function deactivateRoom(roomId: string): Promise<ActionResult> {
  await requireAdmin()

  const futureConflicts = await prisma.activity.findMany({
    where: {
      roomId,
      status: { not: "CANCELLED" },
      startDatetime: { gte: new Date() },
    },
    select: { name: true, startDatetime: true },
  })

  if (futureConflicts.length > 0) {
    const names = futureConflicts.map((a) => a.name).join(", ")
    return {
      error: `Cannot deactivate this room — it has future bookings: ${names}.`,
    }
  }

  await prisma.room.update({ where: { id: roomId }, data: { isActive: false } })
  return { success: true }
}

export async function reactivateRoom(roomId: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.room.update({ where: { id: roomId }, data: { isActive: true } })
  return { success: true }
}

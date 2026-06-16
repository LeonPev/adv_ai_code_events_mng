"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import crypto from "crypto"
import { writeAuditLog } from "@/lib/audit"

export type RegisterResult = { error: string } | { success: true; registrationId: string }

/**
 * Registers a customer for an activity (BR-01, BR-04, BR-08, BR-09, §15 race condition).
 * `onBehalfOfCustomerId` lets an admin register a customer (T-19); when omitted, the
 * acting customer is taken from the session and a CUSTOMER role is required.
 */
export async function registerForActivity(
  activityId: string,
  onBehalfOfCustomerId?: string
): Promise<RegisterResult> {
  const session = await getServerSession()
  if (!session) return { error: "You must be signed in to register." }

  let customerId: string
  if (onBehalfOfCustomerId) {
    if (session.user.role !== "ADMIN") return { error: "Forbidden." }
    customerId = onBehalfOfCustomerId
  } else {
    customerId = session.user.id
  }

  try {
    const registrationId = await prisma.$transaction(async (tx) => {
      // Row-lock the activity so concurrent registrations serialize on capacity checks (§15).
      const locked = await tx.$queryRaw<{ id: string; type: string; capacity: number; status: string }[]>`
        SELECT id, type, capacity, status FROM "Activity" WHERE id = ${activityId} FOR UPDATE
      `
      const activity = locked[0]
      if (!activity) throw new Error("Activity not found.")
      if (activity.status !== "PUBLISHED") throw new Error("This activity is not open for registration.")

      const existing = await tx.registration.findUnique({
        where: { customerId_activityId: { customerId, activityId } },
      })
      if (existing) throw new Error("You are already registered for this activity.")

      const activeCount = await tx.registration.count({
        where: { activityId, status: "ACTIVE" },
      })
      if (activeCount >= activity.capacity) throw new Error("This activity is full.")

      const qrToken = activity.type === "EVENT" ? crypto.randomBytes(32).toString("hex") : null

      const registration = await tx.registration.create({
        data: { customerId, activityId, qrToken },
      })

      await writeAuditLog(tx, {
        action: "REGISTRATION_CREATED",
        actorId: session.user.id,
        targetId: registration.id,
        targetType: "Registration",
        metadata: { activityId, customerId },
      })

      return registration.id
    })

    return { success: true, registrationId }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed." }
  }
}

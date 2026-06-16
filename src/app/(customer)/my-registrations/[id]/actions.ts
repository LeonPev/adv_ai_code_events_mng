"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { writeAuditLog } from "@/lib/audit"

type ActionResult = { error: string } | { success: true }

/**
 * Cancels a registration (BR-05, BR-07, BR-08). Customers may only cancel their own
 * registration before the activity starts; admins (T-20) can cancel any registration at
 * any time (BR-06) — reuse this action with the admin role bypassing the date gate.
 */
export async function cancelRegistration(registrationId: string): Promise<ActionResult> {
  const session = await getServerSession()
  if (!session) return { error: "You must be signed in." }

  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { activity: true },
  })
  if (!registration) return { error: "Registration not found." }

  const isOwner = registration.customerId === session.user.id
  const isAdmin = session.user.role === "ADMIN"
  if (!isOwner && !isAdmin) return { error: "Forbidden." }

  if (registration.status !== "ACTIVE") return { error: "This registration is already cancelled." }

  if (isOwner && !isAdmin && registration.activity.startDatetime && registration.activity.startDatetime <= new Date()) {
    return { error: "This activity has already started; it can no longer be cancelled." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.registration.update({ where: { id: registrationId }, data: { status: "CANCELLED" } })
    await writeAuditLog(tx, {
      action: "REGISTRATION_CANCELLED",
      actorId: session.user.id,
      targetId: registrationId,
      targetType: "Registration",
      metadata: { activityId: registration.activityId },
    })
  })

  return { success: true }
}

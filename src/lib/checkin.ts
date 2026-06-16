import { prisma } from "@/lib/prisma"

export type CheckInFailureReason =
  | "INVALID_TOKEN"
  | "WRONG_EVENT"
  | "NOT_ACTIVE"
  | "ALREADY_CHECKED_IN"
  | "EVENT_CANCELLED"

export type CheckInResult =
  | { ok: true; customerName: string }
  | { ok: false; reason: CheckInFailureReason; message: string; checkedInAt?: Date }

/** §11.1 validation + AttendanceRecord creation, shared by the QR scan API and manual lookup. */
export async function checkInByRegistrationId(
  registrationId: string,
  eventId: string,
  checkedInById: string
): Promise<CheckInResult> {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { activity: true, customer: true, attendance: true },
  })

  if (!registration) {
    return { ok: false, reason: "INVALID_TOKEN", message: "Registration not found." }
  }
  if (registration.activityId !== eventId) {
    return { ok: false, reason: "WRONG_EVENT", message: "This ticket is not for this event." }
  }
  if (registration.activity.status === "CANCELLED") {
    return { ok: false, reason: "EVENT_CANCELLED", message: "This event has been cancelled." }
  }
  if (registration.status !== "ACTIVE") {
    return { ok: false, reason: "NOT_ACTIVE", message: "This registration is not active." }
  }
  if (registration.attendance) {
    const time = registration.attendance.checkedInAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    return {
      ok: false,
      reason: "ALREADY_CHECKED_IN",
      message: `Already checked in at ${time}.`,
      checkedInAt: registration.attendance.checkedInAt,
    }
  }

  await prisma.attendanceRecord.create({
    data: { registrationId, eventId, checkedInById },
  })

  return { ok: true, customerName: registration.customer.fullName }
}

/** Looks up a registration by its QR token for the given event. */
export async function checkInByQrToken(
  qrToken: string,
  eventId: string,
  checkedInById: string
): Promise<CheckInResult> {
  const registration = await prisma.registration.findUnique({ where: { qrToken } })
  if (!registration) {
    return { ok: false, reason: "INVALID_TOKEN", message: "QR code not recognized." }
  }
  return checkInByRegistrationId(registration.id, eventId, checkedInById)
}

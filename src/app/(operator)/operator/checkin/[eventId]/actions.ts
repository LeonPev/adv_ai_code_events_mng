"use server"

import { getServerSession } from "@/lib/auth"
import { checkInByRegistrationId, type CheckInResult } from "@/lib/checkin"

export async function markAttended(registrationId: string, eventId: string): Promise<CheckInResult> {
  const session = await getServerSession()
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN")) {
    return { ok: false, reason: "INVALID_TOKEN", message: "Forbidden." }
  }
  return checkInByRegistrationId(registrationId, eventId, session.user.id)
}

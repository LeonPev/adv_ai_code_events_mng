"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"

type ActionResult = { error: string } | { success: true }

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession()
  if (!session) return { error: "You must be signed in." }

  const fullName = (formData.get("fullName") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim() || null
  const dateOfBirthRaw = formData.get("dateOfBirth") as string

  if (!fullName) return { error: "Full name is required." }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName,
      phone,
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
    },
  })

  return { success: true }
}

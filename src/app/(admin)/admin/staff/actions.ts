"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import bcrypt from "bcryptjs"
import crypto from "crypto"

type CreateStaffResult = { error: string } | { success: true; tempPassword: string }
type ActionResult = { error: string } | { success: true }

async function requireAdmin() {
  const session = await getServerSession()
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden")
  return session
}

function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12)
}

export async function createStaff(formData: FormData): Promise<CreateStaffResult> {
  await requireAdmin()

  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const role = formData.get("role") as string

  if (!fullName) return { error: "Full name is required." }
  if (!email) return { error: "Email is required." }
  if (!["OPERATOR", "ADMIN"].includes(role)) return { error: "Invalid role." }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: "A user with this email already exists." }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  await prisma.user.create({
    data: { email, fullName, role, status: "ACTIVE", passwordHash },
  })

  // Dev convenience — never log credentials in production.
  console.log(`[createStaff] Temporary password for ${email}: ${tempPassword}`)

  return { success: true, tempPassword }
}

export async function updateStaff(staffId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin()

  const fullName = (formData.get("fullName") as string)?.trim()
  const role = formData.get("role") as string

  if (!fullName) return { error: "Full name is required." }
  if (!["OPERATOR", "ADMIN"].includes(role)) return { error: "Invalid role." }

  await prisma.user.update({ where: { id: staffId }, data: { fullName, role } })
  return { success: true }
}

export async function deactivateStaff(staffId: string): Promise<ActionResult> {
  const session = await requireAdmin()

  if (staffId === session.user.id) return { error: "You cannot deactivate yourself." }

  await prisma.user.update({ where: { id: staffId }, data: { status: "INACTIVE" } })
  return { success: true }
}

export async function reactivateStaff(staffId: string): Promise<ActionResult> {
  await requireAdmin()
  await prisma.user.update({ where: { id: staffId }, data: { status: "ACTIVE" } })
  return { success: true }
}

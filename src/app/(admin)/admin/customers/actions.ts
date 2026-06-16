"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"

type ActionResult = { error: string } | { success: true }

async function requireAdmin() {
  const session = await getServerSession()
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden")
  return session
}

export async function toggleCustomerStatus(customerId: string): Promise<ActionResult> {
  await requireAdmin()

  const customer = await prisma.user.findUnique({ where: { id: customerId } })
  if (!customer || customer.role !== "CUSTOMER") return { error: "Customer not found." }

  const nextStatus = customer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
  await prisma.user.update({ where: { id: customerId }, data: { status: nextStatus } })
  return { success: true }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const name = searchParams.get("name")?.trim()
  const eventId = searchParams.get("eventId")

  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 })
  if (!name) return NextResponse.json({ results: [] })

  const registrations = await prisma.registration.findMany({
    where: {
      activityId: eventId,
      status: "ACTIVE",
      customer: { fullName: { contains: name, mode: "insensitive" } },
    },
    include: { customer: { select: { fullName: true } }, attendance: { select: { checkedInAt: true } } },
    take: 20,
  })

  // §14.4 — only return what's needed for check-in, never email/phone.
  const results = registrations.map((r) => ({
    registrationId: r.id,
    customerName: r.customer.fullName,
    checkedInAt: r.attendance?.checkedInAt ?? null,
  }))

  return NextResponse.json({ results })
}

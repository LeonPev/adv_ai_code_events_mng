import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { checkInByQrToken } from "@/lib/checkin"

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session || (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ ok: false, reason: "FORBIDDEN", message: "Forbidden." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const qrToken = body?.qrToken as string | undefined
  const eventId = body?.eventId as string | undefined

  if (!qrToken || !eventId) {
    return NextResponse.json(
      { ok: false, reason: "INVALID_TOKEN", message: "Missing qrToken or eventId." },
      { status: 400 }
    )
  }

  const result = await checkInByQrToken(qrToken, eventId, session.user.id)
  return NextResponse.json(result)
}

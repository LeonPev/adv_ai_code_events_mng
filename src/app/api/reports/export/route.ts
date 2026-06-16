import { NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import { getServerSession } from "@/lib/auth"
import { getAttendanceReportRows, getCapacityReportRows, getRegistrationReportRows } from "@/lib/reports"

const HEADERS: Record<string, string[]> = {
  attendance: ["customerName", "eventName", "registeredAt", "checkedInAt"],
  registration: ["customerName", "activityName", "type", "registeredAt", "status", "payment"],
  capacity: ["name", "type", "capacity", "activeRegistrations", "fillPct"],
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "attendance"
  const eventId = searchParams.get("eventId") ?? undefined
  const activityId = searchParams.get("activityId") ?? undefined
  const activityType = searchParams.get("activityType") ?? undefined
  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined

  let rows: Record<string, unknown>[]
  if (type === "registration") {
    rows = (await getRegistrationReportRows({ activityId, type: activityType, from, to })) as unknown as Record<string, unknown>[]
  } else if (type === "capacity") {
    rows = (await getCapacityReportRows()) as unknown as Record<string, unknown>[]
  } else {
    rows = (await getAttendanceReportRows({ eventId, from, to })) as unknown as Record<string, unknown>[]
  }

  // EC-12: empty results still export headers only.
  const csv = Papa.unparse({ fields: HEADERS[type] ?? Object.keys(rows[0] ?? {}), data: rows })

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-report.csv"`,
    },
  })
}

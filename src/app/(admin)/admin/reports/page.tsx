import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getAttendanceReportRows, getCapacityReportRows, getRegistrationReportRows } from "@/lib/reports"
import { PrintButton } from "./PrintButton"

type ReportType = "attendance" | "registration" | "capacity"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { type?: string; eventId?: string; activityId?: string; activityType?: string; from?: string; to?: string }
}) {
  const type = (searchParams.type as ReportType) ?? "attendance"
  const { eventId, activityId, activityType, from, to } = searchParams

  const [pastEvents, allActivities] = await Promise.all([
    prisma.activity.findMany({ where: { type: "EVENT" }, orderBy: { startDatetime: "desc" } }),
    prisma.activity.findMany({ orderBy: { name: "asc" } }),
  ])

  let rows: Record<string, unknown>[] = []
  let columns: string[] = []

  if (type === "attendance") {
    rows = await getAttendanceReportRows({ eventId, from, to }) as unknown as Record<string, unknown>[]
    columns = ["customerName", "eventName", "registeredAt", "checkedInAt"]
  } else if (type === "registration") {
    rows = await getRegistrationReportRows({ activityId, type: activityType, from, to }) as unknown as Record<string, unknown>[]
    columns = ["customerName", "activityName", "type", "registeredAt", "status", "payment"]
  } else {
    rows = await getCapacityReportRows() as unknown as Record<string, unknown>[]
    columns = ["name", "type", "capacity", "activeRegistrations", "fillPct"]
  }

  const exportParams = new URLSearchParams({
    type,
    ...(eventId ? { eventId } : {}),
    ...(activityId ? { activityId } : {}),
    ...(activityType ? { activityType } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="flex gap-2 mb-6">
        {(["attendance", "registration", "capacity"] as ReportType[]).map((t) => (
          <Link
            key={t}
            href={`/admin/reports?type=${t}`}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              type === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t === "attendance" ? "Attendance" : t === "registration" ? "Registration" : "Capacity Utilization"}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-3 mb-4" method="get">
        <input type="hidden" name="type" value={type} />
        {type === "attendance" && (
          <select name="eventId" defaultValue={eventId ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">All Events</option>
            {pastEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        {type === "registration" && (
          <>
            <select name="activityId" defaultValue={activityId ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
              <option value="">All Activities</option>
              {allActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select name="activityType" defaultValue={activityType ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
              <option value="">All Types</option>
              <option value="EVENT">Event</option>
              <option value="SEMINAR">Seminar</option>
              <option value="COURSE">Course</option>
            </select>
          </>
        )}
        {type !== "capacity" && (
          <>
            <input name="from" type="date" defaultValue={from} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
            <input name="to" type="date" defaultValue={to} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
          </>
        )}
        <button type="submit" className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
          Apply
        </button>
      </form>

      <div className="flex gap-2 mb-4">
        <a
          href={`/api/reports/export?${exportParams.toString()}`}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Export CSV
        </a>
        <PrintButton />
      </div>

      <div id="report-preview" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                {columns.map((c) => (
                  <td key={c} className="px-4 py-2">
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAttendanceReportRows } from "@/lib/reports"

export default async function ActivityAttendancePage({ params }: { params: { id: string } }) {
  const activity = await prisma.activity.findUnique({ where: { id: params.id } })
  if (!activity) notFound()

  const rows = await getAttendanceReportRows({ eventId: activity.id })

  return (
    <div>
      <Link href={`/admin/activities/${activity.id}`} className="text-sm text-blue-600 hover:underline">
        ← Back to activity
      </Link>
      <div className="flex items-center justify-between mt-1 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance — {activity.name}</h1>
        <a
          href={`/api/reports/export?type=attendance&eventId=${activity.id}`}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Registered At</th>
              <th className="px-4 py-2 font-medium">Checked In</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2">{r.customerName}</td>
                <td className="px-4 py-2">{new Date(r.registeredAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  {r.checkedInAt === "No-show" ? r.checkedInAt : new Date(r.checkedInAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
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

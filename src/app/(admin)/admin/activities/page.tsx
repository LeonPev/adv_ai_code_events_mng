import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"
import type { Prisma } from "@prisma/client"

export default async function ActivitiesListPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; status?: string; room?: string }
}) {
  const { q, type, status, room } = searchParams

  const where: Prisma.ActivityWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(room ? { roomId: room } : {}),
  }

  const [activities, rooms] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: { room: true, _count: { select: { registrations: { where: { status: "ACTIVE" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <Link
          href="/admin/activities/new"
          className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          New Activity
        </Link>
      </div>

      <form className="flex flex-wrap gap-3 mb-4" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        />
        <select name="type" defaultValue={type ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="EVENT">Event</option>
          <option value="SEMINAR">Seminar</option>
          <option value="COURSE">Course</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select name="room" defaultValue={room ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button type="submit" className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Room</th>
              <th className="px-4 py-2 font-medium">Start</th>
              <th className="px-4 py-2 font-medium">Registrations</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/activities/${a.id}`} className="text-blue-600 hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Badge tone={a.type}>{a.type}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge tone={a.status}>{a.status}</Badge>
                </td>
                <td className="px-4 py-2">{a.room.name}</td>
                <td className="px-4 py-2">{a.startDatetime ? a.startDatetime.toLocaleString() : "—"}</td>
                <td className="px-4 py-2">
                  {a._count.registrations} / {a.capacity}
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No activities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

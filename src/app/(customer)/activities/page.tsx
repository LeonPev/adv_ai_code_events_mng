import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"
import type { Prisma } from "@prisma/client"

export default async function ActivityBrowserPage({
  searchParams,
}: {
  searchParams: { type?: string; from?: string; to?: string }
}) {
  const { type, from, to } = searchParams

  const where: Prisma.ActivityWhereInput = {
    status: "PUBLISHED",
    ...(type ? { type } : {}),
    ...(from || to
      ? {
          startDatetime: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      room: true,
      _count: { select: { registrations: { where: { status: "ACTIVE" } } } },
      sessions: { orderBy: { sessionNumber: "asc" } },
    },
    orderBy: { startDatetime: "asc" },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activities</h1>

      <form className="flex flex-wrap gap-3 mb-6" method="get">
        <select name="type" defaultValue={type ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="EVENT">Event</option>
          <option value="SEMINAR">Seminar</option>
          <option value="COURSE">Course</option>
        </select>
        <input name="from" type="date" defaultValue={from} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
        <input name="to" type="date" defaultValue={to} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
        <button type="submit" className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((a) => {
          const full = a._count.registrations >= a.capacity
          return (
            <Link
              key={a.id}
              href={`/activities/${a.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge tone={a.type}>{a.type}</Badge>
                {full && <Badge tone="FULL">Full</Badge>}
              </div>
              <h2 className="font-semibold text-gray-900 mb-1">{a.name}</h2>
              <p className="text-sm text-gray-500 mb-1">
                {a.type === "COURSE"
                  ? `Course — ${a.sessions.length} session${a.sessions.length === 1 ? "" : "s"}`
                  : a.startDatetime?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mb-1">{a.room.name}</p>
              {!full && (
                <p className="text-sm text-gray-500">
                  {a._count.registrations} / {a.capacity} registered
                </p>
              )}
              {a.pricePlaceholder != null && (
                <p className="text-sm text-gray-500">${a.pricePlaceholder.toFixed(2)}</p>
              )}
            </Link>
          )
        })}
        {activities.length === 0 && <p className="text-gray-500 col-span-full">No activities found.</p>}
      </div>
    </div>
  )
}

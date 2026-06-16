import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"
import { RoomUtilizationChart } from "./RoomUtilizationChart"

function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day // Monday as start
  date.setDate(date.getDate() + diff)
  return date
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = startOfWeek(now)
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)
  const next7Days = new Date(now.getTime() + 7 * 86_400_000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)

  const [
    activeCustomers,
    registrationsToday,
    activitiesThisWeek,
    topActivityGroup,
    recentRegistrations,
    upcomingActivities,
    roomBookingsThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER", status: "ACTIVE" } }),
    prisma.registration.count({ where: { registeredAt: { gte: startOfToday } } }),
    prisma.activity.count({
      where: { status: "PUBLISHED", startDatetime: { gte: weekStart, lt: weekEnd } },
    }),
    prisma.registration.groupBy({
      by: ["activityId"],
      where: { status: "ACTIVE", registeredAt: { gte: thirtyDaysAgo } },
      _count: { activityId: true },
      orderBy: { _count: { activityId: "desc" } },
      take: 1,
    }),
    prisma.registration.findMany({
      take: 10,
      orderBy: { registeredAt: "desc" },
      include: { customer: true, activity: true },
    }),
    prisma.activity.findMany({
      where: { status: "PUBLISHED", startDatetime: { gte: now, lte: next7Days } },
      include: { _count: { select: { registrations: { where: { status: "ACTIVE" } } } } },
      orderBy: { startDatetime: "asc" },
    }),
    prisma.activity.findMany({
      where: { status: { not: "CANCELLED" }, startDatetime: { gte: weekStart, lt: weekEnd } },
      include: { room: true },
    }),
  ])

  const topActivity = topActivityGroup[0]
    ? await prisma.activity.findUnique({ where: { id: topActivityGroup[0].activityId } })
    : null

  const roomCounts = new Map<string, number>()
  for (const a of roomBookingsThisWeek) {
    roomCounts.set(a.room.name, (roomCounts.get(a.room.name) ?? 0) + 1)
  }
  const roomChartData = Array.from(roomCounts.entries()).map(([room, count]) => ({ room, count }))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Registrations Today</p>
          <p className="text-2xl font-bold text-gray-900">{registrationsToday}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Activities This Week</p>
          <p className="text-2xl font-bold text-gray-900">{activitiesThisWeek}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Top Activity (30d)</p>
          <p className="text-lg font-bold text-gray-900">{topActivity?.name ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Recent Registrations</h2>
          <ul className="space-y-2 text-sm">
            {recentRegistrations.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/registrations/${r.id}`} className="text-blue-600 hover:underline">
                  {r.customer.fullName}
                </Link>{" "}
                → {r.activity.name}
              </li>
            ))}
            {recentRegistrations.length === 0 && <li className="text-gray-500">No registrations yet.</li>}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Upcoming Activities (Next 7 Days)</h2>
          <ul className="space-y-2 text-sm">
            {upcomingActivities.map((a) => {
              const fillPct = a.capacity > 0 ? Math.round((a._count.registrations / a.capacity) * 100) : 0
              return (
                <li key={a.id} className="flex items-center justify-between">
                  <span>
                    {a.name} — {a.startDatetime?.toLocaleDateString()}
                  </span>
                  <Badge tone="ACTIVE">{fillPct}%</Badge>
                </li>
              )
            })}
            {upcomingActivities.length === 0 && <li className="text-gray-500">No upcoming activities.</li>}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Room Utilization (This Week)</h2>
          {roomChartData.length > 0 ? (
            <RoomUtilizationChart data={roomChartData} />
          ) : (
            <p className="text-sm text-gray-500">No bookings this week.</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link href="/admin/activities/new" className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 text-center">
              New Activity
            </Link>
            <Link href="/admin/reports" className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-center">
              View Reports
            </Link>
            <Link href="/admin/customers" className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 text-center">
              Manage Customers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

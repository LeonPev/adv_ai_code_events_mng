import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/Badge"

function isUpcoming(activity: { startDatetime: Date | null; sessions: { startDatetime: Date }[] }): boolean {
  const now = Date.now()
  if (activity.sessions.length > 0) return activity.sessions.some((s) => s.startDatetime.getTime() > now)
  return !!activity.startDatetime && activity.startDatetime.getTime() > now
}

export default async function MyRegistrationsPage() {
  const session = await getServerSession()
  if (!session) redirect("/auth/login?callbackUrl=/my-registrations")

  const registrations = await prisma.registration.findMany({
    where: { customerId: session.user.id },
    include: { activity: { include: { room: true, sessions: true } } },
    orderBy: { registeredAt: "desc" },
  })

  const upcoming = registrations.filter((r) => isUpcoming(r.activity))
  const past = registrations.filter((r) => !isUpcoming(r.activity))

  function Row({ r }: { r: (typeof registrations)[number] }) {
    return (
      <Link
        key={r.id}
        href={`/my-registrations/${r.id}`}
        className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50"
      >
        <div>
          <p className="font-medium text-gray-900">{r.activity.name}</p>
          <p className="text-sm text-gray-500">
            <Badge tone={r.activity.type}>{r.activity.type}</Badge>{" "}
            {r.activity.startDatetime?.toLocaleString() ?? `${r.activity.sessions.length} sessions`} —{" "}
            {r.activity.room.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={r.status}>{r.status === "ACTIVE" ? "Active" : "Cancelled"}</Badge>
          {r.activity.type === "EVENT" && r.status === "ACTIVE" && (
            <span className="text-sm text-blue-600">Show QR</span>
          )}
        </div>
      </Link>
    )
  }

  if (registrations.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Registrations</h1>
        <p className="text-gray-500">
          You have no registrations yet.{" "}
          <Link href="/activities" className="text-blue-600 hover:underline">
            Browse activities →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h2>
        <div className="space-y-2">
          {upcoming.map((r) => <Row key={r.id} r={r} />)}
          {upcoming.length === 0 && <p className="text-sm text-gray-500">No upcoming registrations.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Past</h2>
        <div className="space-y-2">
          {past.map((r) => <Row key={r.id} r={r} />)}
          {past.length === 0 && <p className="text-sm text-gray-500">No past registrations.</p>}
        </div>
      </div>
    </div>
  )
}

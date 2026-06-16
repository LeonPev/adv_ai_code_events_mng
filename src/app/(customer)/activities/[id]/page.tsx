import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { Badge } from "@/components/ui/Badge"
import { RegisterButton } from "./RegisterButton"

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const [activity, session] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        sessions: { orderBy: { sessionNumber: "asc" } },
        _count: { select: { registrations: { where: { status: "ACTIVE" } } } },
      },
    }),
    getServerSession(),
  ])

  if (!activity || activity.status !== "PUBLISHED") notFound()

  const activeCount = activity._count.registrations
  const full = activeCount >= activity.capacity
  const fillPct = activity.capacity > 0 ? Math.min(100, Math.round((activeCount / activity.capacity) * 100)) : 0

  const existingRegistration = session
    ? await prisma.registration.findUnique({
        where: { customerId_activityId: { customerId: session.user.id, activityId: activity.id } },
      })
    : null
  const alreadyRegistered = !!existingRegistration && existingRegistration.status === "ACTIVE"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Badge tone={activity.type}>{activity.type}</Badge>
        {full && <Badge tone="FULL">Full</Badge>}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{activity.name}</h1>
      <p className="text-gray-600 mb-4">{activity.description}</p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 mb-6">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Room:</span> {activity.room.name}
        </p>
        {activity.type === "COURSE" ? (
          <div>
            <p className="font-medium text-sm text-gray-700 mb-1">Sessions:</p>
            <ul className="text-sm text-gray-600 list-disc pl-5">
              {activity.sessions.map((s) => (
                <li key={s.id}>
                  #{s.sessionNumber}: {s.startDatetime.toLocaleString()} – {s.endDatetime.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            <span className="font-medium">When:</span> {activity.startDatetime?.toLocaleString()} –{" "}
            {activity.endDatetime?.toLocaleString()}
          </p>
        )}
        {activity.pricePlaceholder != null && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Price:</span> ${activity.pricePlaceholder.toFixed(2)}
          </p>
        )}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {activeCount} / {activity.capacity} registered
            </span>
            <span>{fillPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      </div>

      <RegisterButton
        activityId={activity.id}
        isLoggedIn={!!session}
        alreadyRegistered={alreadyRegistered}
        full={full}
      />
    </div>
  )
}

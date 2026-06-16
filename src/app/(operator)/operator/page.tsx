import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function EventSelectionPage() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const events = await prisma.activity.findMany({
    where: {
      type: "EVENT",
      status: "PUBLISHED",
      startDatetime: { gte: startOfDay, lte: endOfDay },
    },
    include: { room: true, _count: { select: { registrations: { where: { status: "ACTIVE" } } } } },
    orderBy: { startDatetime: "asc" },
  })

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Today&apos;s Events</h1>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No events scheduled for today.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/operator/checkin/${e.id}`}
              className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700"
            >
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-gray-400">
                {e.startDatetime?.toLocaleTimeString()} — {e.room.name}
              </p>
              <p className="text-sm text-gray-400">
                {e._count.registrations} / {e.capacity} registered
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

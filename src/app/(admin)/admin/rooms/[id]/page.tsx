import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RoomForm } from "../RoomForm"
import { updateRoom, deactivateRoom, reactivateRoom } from "../actions"
import { Badge } from "@/components/ui/Badge"
import { DeactivateRoomButton } from "./DeactivateRoomButton"

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const room = await prisma.room.findUnique({ where: { id: params.id } })
  if (!room) notFound()

  const upcoming = await prisma.activity.findMany({
    where: {
      roomId: room.id,
      status: { not: "CANCELLED" },
      startDatetime: { gte: new Date() },
    },
    orderBy: { startDatetime: "asc" },
    select: { id: true, name: true, type: true, startDatetime: true, endDatetime: true },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {room.name} <Badge tone={room.isActive ? "ACTIVE" : "INACTIVE"}>{room.isActive ? "Active" : "Inactive"}</Badge>
        </h1>
        <DeactivateRoomButton
          roomId={room.id}
          isActive={room.isActive}
          deactivateAction={deactivateRoom}
          reactivateAction={reactivateRoom}
        />
      </div>

      <RoomForm
        initial={{ name: room.name, type: room.type, capacity: room.capacity, description: room.description }}
        action={(formData) => updateRoom(room.id, formData)}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Bookings</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Activity</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">{a.type}</td>
                  <td className="px-4 py-2">{a.startDatetime?.toLocaleString()}</td>
                  <td className="px-4 py-2">{a.endDatetime?.toLocaleString()}</td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No upcoming bookings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

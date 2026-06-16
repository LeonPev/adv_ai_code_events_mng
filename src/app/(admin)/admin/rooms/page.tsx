import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"

export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <Link
          href="/admin/rooms/new"
          className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          New Room
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Capacity</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                className={`border-t border-gray-100 ${!room.isActive ? "text-gray-400" : "text-gray-900"}`}
              >
                <td className="px-4 py-2">{room.name}</td>
                <td className="px-4 py-2">{room.type}</td>
                <td className="px-4 py-2">{room.capacity}</td>
                <td className="px-4 py-2">
                  <Badge tone={room.isActive ? "ACTIVE" : "INACTIVE"}>
                    {room.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/rooms/${room.id}`} className="text-blue-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No rooms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { RoomForm } from "../RoomForm"
import { createRoom } from "../actions"

export default function NewRoomPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Room</h1>
      <RoomForm action={createRoom} />
    </div>
  )
}

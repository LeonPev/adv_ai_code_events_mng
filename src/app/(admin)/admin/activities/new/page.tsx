import { prisma } from "@/lib/prisma"
import { ActivityForm } from "../ActivityForm"
import { createActivity } from "../actions"

export default async function NewActivityPage() {
  const rooms = await prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Activity</h1>
      <ActivityForm rooms={rooms} action={createActivity} />
    </div>
  )
}

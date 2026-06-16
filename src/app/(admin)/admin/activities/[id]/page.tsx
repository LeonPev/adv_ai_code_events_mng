import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ActivityForm } from "../ActivityForm"
import {
  updateActivity,
  publishActivity,
  cancelActivity,
  addCourseSession,
  updateCourseSession,
  deleteCourseSession,
} from "../actions"
import { Badge } from "@/components/ui/Badge"
import { CourseSessionsSection } from "./CourseSessionsSection"
import { ActivityActions } from "./ActivityActions"
import { countActiveRegistrations, isOverCommitted } from "@/lib/capacity"

export default async function ActivityDetailAdminPage({ params }: { params: { id: string } }) {
  const [activity, rooms] = await Promise.all([
    prisma.activity.findUnique({
      where: { id: params.id },
      include: { sessions: { include: { room: true } } },
    }),
    prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  if (!activity) notFound()
  const act = activity

  const activeRegistrations = await countActiveRegistrations(act.id)
  const overCommitted = isOverCommitted(activeRegistrations, act.capacity)

  async function updateForThisActivity(formData: FormData) {
    "use server"
    return updateActivity(act.id, act.updatedAt.toISOString(), formData)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/activities" className="text-sm text-blue-600 hover:underline">
            ← Back to list
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            {activity.name}
            <Badge tone={activity.status}>{activity.status}</Badge>
            {overCommitted && <Badge tone="WARNING">Over-committed</Badge>}
          </h1>
        </div>
        <ActivityActions
          activityId={activity.id}
          status={activity.status}
          activeRegistrationCount={activeRegistrations}
          publishAction={publishActivity}
          cancelAction={cancelActivity}
        />
      </div>

      <p className="text-sm text-gray-600">
        Registrations: {activeRegistrations} / {activity.capacity}
      </p>

      <ActivityForm
        rooms={rooms}
        lockType
        initial={{
          name: activity.name,
          type: activity.type,
          description: activity.description,
          capacity: activity.capacity,
          pricePlaceholder: activity.pricePlaceholder,
          roomId: activity.roomId,
          status: activity.status,
          startDatetime: activity.startDatetime,
          endDatetime: activity.endDatetime,
        }}
        action={updateForThisActivity}
      />

      {activity.type === "COURSE" && (
        <CourseSessionsSection
          courseId={activity.id}
          rooms={rooms}
          sessions={activity.sessions.map((s) => ({
            id: s.id,
            sessionNumber: s.sessionNumber,
            startDatetime: s.startDatetime.toISOString(),
            endDatetime: s.endDatetime.toISOString(),
            roomId: s.roomId,
            roomName: s.room.name,
          }))}
          addAction={addCourseSession}
          updateAction={updateCourseSession}
          deleteAction={deleteCourseSession}
        />
      )}
    </div>
  )
}

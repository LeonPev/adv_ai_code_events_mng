import { prisma } from "@/lib/prisma"

export interface RoomConflictCheck {
  roomId: string
  start: Date
  end: Date
  /** Activity id to exclude (when editing that activity's own Event/Seminar schedule). */
  excludeActivityId?: string
  /** CourseSession id to exclude (when editing that session's own time window). */
  excludeSessionId?: string
}

export interface RoomConflict {
  name: string
  startDatetime: Date
  endDatetime: Date
}

/**
 * BR-12 overlap check: newStart < existEnd AND newEnd > existStart.
 * Excludes CANCELLED activities and (optionally) the record currently being edited.
 * Checks both standalone Event/Seminar activities and CourseSession windows in the room.
 */
export async function findRoomConflict({
  roomId,
  start,
  end,
  excludeActivityId,
  excludeSessionId,
}: RoomConflictCheck): Promise<RoomConflict | null> {
  const conflictingActivity = await prisma.activity.findFirst({
    where: {
      roomId,
      status: { not: "CANCELLED" },
      startDatetime: { not: null, lt: end },
      endDatetime: { not: null, gt: start },
      ...(excludeActivityId ? { id: { not: excludeActivityId } } : {}),
    },
    select: { name: true, startDatetime: true, endDatetime: true },
  })

  if (conflictingActivity?.startDatetime && conflictingActivity?.endDatetime) {
    return {
      name: conflictingActivity.name,
      startDatetime: conflictingActivity.startDatetime,
      endDatetime: conflictingActivity.endDatetime,
    }
  }

  const conflictingSession = await prisma.courseSession.findFirst({
    where: {
      roomId,
      startDatetime: { lt: end },
      endDatetime: { gt: start },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      course: { status: { not: "CANCELLED" } },
    },
    select: {
      startDatetime: true,
      endDatetime: true,
      course: { select: { name: true } },
    },
  })

  if (conflictingSession) {
    return {
      name: conflictingSession.course.name,
      startDatetime: conflictingSession.startDatetime,
      endDatetime: conflictingSession.endDatetime,
    }
  }

  return null
}

export function formatConflictError(conflict: RoomConflict): string {
  const fmt = (d: Date) =>
    d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
  return `This room is already booked for "${conflict.name}" (${fmt(conflict.startDatetime)} – ${fmt(conflict.endDatetime)}).`
}

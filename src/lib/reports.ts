import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export interface AttendanceReportFilters {
  eventId?: string
  from?: string
  to?: string
}

export interface AttendanceReportRow {
  customerName: string
  eventName: string
  registeredAt: string
  checkedInAt: string
}

export async function getAttendanceReportRows(filters: AttendanceReportFilters): Promise<AttendanceReportRow[]> {
  const where: Prisma.RegistrationWhereInput = {
    activity: { type: "EVENT", ...(filters.eventId ? { id: filters.eventId } : {}) },
    ...(filters.from || filters.to
      ? {
          registeredAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: { customer: true, activity: true, attendance: true },
    orderBy: { registeredAt: "desc" },
  })

  return registrations.map((r) => ({
    customerName: r.customer.fullName,
    eventName: r.activity.name,
    registeredAt: r.registeredAt.toISOString(),
    checkedInAt: r.attendance ? r.attendance.checkedInAt.toISOString() : "No-show",
  }))
}

export interface RegistrationReportFilters {
  activityId?: string
  type?: string
  from?: string
  to?: string
}

export interface RegistrationReportRow {
  customerName: string
  activityName: string
  type: string
  registeredAt: string
  status: string
  payment: string
}

export async function getRegistrationReportRows(filters: RegistrationReportFilters): Promise<RegistrationReportRow[]> {
  const where: Prisma.RegistrationWhereInput = {
    ...(filters.activityId ? { activityId: filters.activityId } : {}),
    ...(filters.type ? { activity: { type: filters.type } } : {}),
    ...(filters.from || filters.to
      ? {
          registeredAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: { customer: true, activity: true },
    orderBy: { registeredAt: "desc" },
  })

  return registrations.map((r) => ({
    customerName: r.customer.fullName,
    activityName: r.activity.name,
    type: r.activity.type,
    registeredAt: r.registeredAt.toISOString(),
    status: r.status,
    payment: r.paymentStatusPlaceholder,
  }))
}

export interface CapacityReportRow {
  name: string
  type: string
  capacity: number
  activeRegistrations: number
  fillPct: number
}

export async function getCapacityReportRows(): Promise<CapacityReportRow[]> {
  const activities = await prisma.activity.findMany({
    where: { status: "PUBLISHED" },
    include: { _count: { select: { registrations: { where: { status: "ACTIVE" } } } } },
  })

  return activities
    .map((a) => ({
      name: a.name,
      type: a.type,
      capacity: a.capacity,
      activeRegistrations: a._count.registrations,
      fillPct: a.capacity > 0 ? Math.round((a._count.registrations / a.capacity) * 100) : 0,
    }))
    .sort((a, b) => b.fillPct - a.fillPct)
}

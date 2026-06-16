import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

/** Active (non-cancelled) registration count for an activity. */
export async function countActiveRegistrations(
  activityId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  return client.registration.count({
    where: { activityId, status: "ACTIVE" },
  })
}

export function isOverCommitted(activeRegistrations: number, capacity: number): boolean {
  return activeRegistrations > capacity
}

export function isFull(activeRegistrations: number, capacity: number): boolean {
  return activeRegistrations >= capacity
}

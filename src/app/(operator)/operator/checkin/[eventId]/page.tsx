import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Scanner } from "./Scanner"

export default async function CheckInScannerPage({ params }: { params: { eventId: string } }) {
  const event = await prisma.activity.findUnique({
    where: { id: params.eventId },
    include: { _count: { select: { attendance: true } } },
  })

  if (!event || event.type !== "EVENT") notFound()

  return (
    <Scanner
      eventId={event.id}
      eventName={event.name}
      eventDate={event.startDatetime?.toLocaleString() ?? ""}
      initialCheckedIn={event._count.attendance}
      capacity={event.capacity}
      disabled={event.status === "CANCELLED"}
    />
  )
}

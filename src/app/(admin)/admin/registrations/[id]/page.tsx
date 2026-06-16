import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/Badge"
import { CancelRegistrationButton } from "@/app/(customer)/my-registrations/[id]/CancelRegistrationButton"

export default async function RegistrationDetailAdminPage({ params }: { params: { id: string } }) {
  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { customer: true, activity: { include: { room: true } }, attendance: true },
  })

  if (!registration) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Registration Detail</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-1 text-sm">
        <p>
          <span className="font-medium">Customer:</span> {registration.customer.fullName} ({registration.customer.email})
        </p>
        <p>
          <span className="font-medium">Activity:</span> {registration.activity.name}{" "}
          <Badge tone={registration.activity.type}>{registration.activity.type}</Badge>
        </p>
        <p>
          <span className="font-medium">Room:</span> {registration.activity.room.name}
        </p>
        <p>
          <span className="font-medium">Registered At:</span> {registration.registeredAt.toLocaleString()}
        </p>
        <p>
          <span className="font-medium">Status:</span>{" "}
          <Badge tone={registration.status}>{registration.status === "ACTIVE" ? "Active" : "Cancelled"}</Badge>
        </p>
        {registration.activity.type === "EVENT" && (
          <p>
            <span className="font-medium">Attendance:</span>{" "}
            {registration.attendance
              ? `Checked in at ${registration.attendance.checkedInAt.toLocaleString()}`
              : "Not checked in"}
          </p>
        )}
      </div>

      {registration.status === "ACTIVE" && <CancelRegistrationButton registrationId={registration.id} />}
    </div>
  )
}

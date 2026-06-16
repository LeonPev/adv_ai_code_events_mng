import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { Badge } from "@/components/ui/Badge"
import { QrSection } from "./QrSection"
import { CancelRegistrationButton } from "./CancelRegistrationButton"

export default async function RegistrationDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session) redirect(`/auth/login?callbackUrl=/my-registrations/${params.id}`)

  const registration = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { activity: { include: { room: true } } },
  })

  if (!registration) notFound()
  if (registration.customerId !== session.user.id && session.user.role !== "ADMIN") notFound()

  const canCancel =
    registration.status === "ACTIVE" &&
    (!registration.activity.startDatetime || registration.activity.startDatetime > new Date())

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{registration.activity.name}</h1>
      <div className="flex items-center gap-2 mb-4">
        <Badge tone={registration.activity.type}>{registration.activity.type}</Badge>
        <Badge tone={registration.status}>{registration.status === "ACTIVE" ? "Active" : "Cancelled"}</Badge>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-1 mb-6 text-sm text-gray-700">
        <p>
          <span className="font-medium">Room:</span> {registration.activity.room.name}
        </p>
        {registration.activity.startDatetime && (
          <p>
            <span className="font-medium">When:</span> {registration.activity.startDatetime.toLocaleString()}
          </p>
        )}
      </div>

      {registration.activity.type === "EVENT" && registration.status === "ACTIVE" && registration.qrToken && (
        <QrSection registrationId={registration.id} qrToken={registration.qrToken} />
      )}

      {canCancel && <CancelRegistrationButton registrationId={registration.id} />}
    </div>
  )
}

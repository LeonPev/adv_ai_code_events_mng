import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/Badge"
import { StatusToggle } from "./StatusToggle"
import { AdminRegisterForm } from "./AdminRegisterForm"
import { toggleCustomerStatus } from "../actions"
import { registerForActivity } from "@/app/(customer)/activities/[id]/actions"
import { CancelRegistrationButton } from "@/app/(customer)/my-registrations/[id]/CancelRegistrationButton"

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      registrations: {
        include: { activity: true, attendance: true },
        orderBy: { registeredAt: "desc" },
      },
    },
  })

  if (!customer || customer.role !== "CUSTOMER") notFound()

  const activeRegistrationCount = customer.registrations.filter((r) => r.status === "ACTIVE").length

  const publishedActivities = await prisma.activity.findMany({
    where: { status: "PUBLISHED" },
    include: { _count: { select: { registrations: { where: { status: "ACTIVE" } } } } },
  })
  const registeredActivityIds = new Set(
    customer.registrations.filter((r) => r.status === "ACTIVE").map((r) => r.activityId)
  )
  const availableActivities = publishedActivities
    .filter((a) => !registeredActivityIds.has(a.id) && a._count.registrations < a.capacity)
    .map((a) => ({ id: a.id, name: a.name, spotsLeft: a.capacity - a._count.registrations }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {customer.fullName}
            <Badge tone={customer.status}>{customer.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
          </h1>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
        <StatusToggle
          customerId={customer.id}
          status={customer.status}
          activeRegistrationCount={activeRegistrationCount}
          action={toggleCustomerStatus}
        />
      </div>

      <AdminRegisterForm customerId={customer.id} activities={availableActivities} registerAction={registerForActivity} />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Registration History</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Activity</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Attendance</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {customer.registrations.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{r.activity.name}</td>
                  <td className="px-4 py-2">
                    <Badge tone={r.activity.type}>{r.activity.type}</Badge>
                  </td>
                  <td className="px-4 py-2">{r.activity.startDatetime?.toLocaleDateString() ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge tone={r.status}>{r.status === "ACTIVE" ? "Active" : "Cancelled"}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    {r.activity.type === "EVENT" ? (r.attendance ? "Checked in" : "Not checked in") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.status === "ACTIVE" && <CancelRegistrationButton registrationId={r.id} />}
                  </td>
                </tr>
              ))}
              {customer.registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

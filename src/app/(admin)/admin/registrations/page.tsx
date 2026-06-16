import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"
import type { Prisma } from "@prisma/client"

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: { type?: string; status?: string; from?: string; to?: string }
}) {
  const { type, status, from, to } = searchParams

  const where: Prisma.RegistrationWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { activity: { type } } : {}),
    ...(from || to
      ? {
          registeredAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: { customer: true, activity: true },
    orderBy: { registeredAt: "desc" },
    take: 200,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrations</h1>

      <form className="flex flex-wrap gap-3 mb-4" method="get">
        <select name="type" defaultValue={type ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="EVENT">Event</option>
          <option value="SEMINAR">Seminar</option>
          <option value="COURSE">Course</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input name="from" type="date" defaultValue={from} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
        <input name="to" type="date" defaultValue={to} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
        <button type="submit" className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
          Filter
        </button>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Activity</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Registered At</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{r.customer.fullName}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/registrations/${r.id}`} className="text-blue-600 hover:underline">
                    {r.activity.name}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Badge tone={r.activity.type}>{r.activity.type}</Badge>
                </td>
                <td className="px-4 py-2">{r.registeredAt.toLocaleString()}</td>
                <td className="px-4 py-2">
                  <Badge tone={r.status}>{r.status === "ACTIVE" ? "Active" : "Cancelled"}</Badge>
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

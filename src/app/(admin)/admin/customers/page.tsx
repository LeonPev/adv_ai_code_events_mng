import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/Badge"

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim()

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { registrations: true } } },
    orderBy: { fullName: "asc" },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

      <form className="mb-4" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-72"
        />
      </form>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Registrations</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{c.fullName}</td>
                <td className="px-4 py-2">{c.email}</td>
                <td className="px-4 py-2">
                  <Badge tone={c.status}>{c.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>
                </td>
                <td className="px-4 py-2">{c._count.registrations}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/customers/${c.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

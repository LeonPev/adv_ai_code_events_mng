import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { NewStaffForm } from "./NewStaffForm"
import { StaffRow } from "./StaffRow"

export default async function StaffPage() {
  const session = await getServerSession()
  const staff = await prisma.user.findMany({
    where: { role: { in: ["OPERATOR", "ADMIN"] } },
    orderBy: { fullName: "asc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <NewStaffForm />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <StaffRow
                key={s.id}
                id={s.id}
                fullName={s.fullName}
                email={s.email}
                role={s.role}
                status={s.status}
                isSelf={s.id === session?.user.id}
              />
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

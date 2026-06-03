import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/reports", label: "Reports" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/auth/login")
  if (session.user.role !== "ADMIN") redirect("/activities")

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="font-bold text-gray-900 text-sm">Community Center</span>
          <p className="text-xs text-gray-500 mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-500">
          {session.user.name}
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  )
}

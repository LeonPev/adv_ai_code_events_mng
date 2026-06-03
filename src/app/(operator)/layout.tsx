import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect("/auth/login")
  if (session.user.role !== "OPERATOR" && session.user.role !== "ADMIN") {
    redirect("/activities")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-3 flex items-center gap-4">
        <span className="font-semibold">Check-In</span>
        <span className="ml-auto text-sm text-gray-400">{session.user.name}</span>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}

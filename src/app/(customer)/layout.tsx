import Link from "next/link"
import { getServerSession } from "@/lib/auth"
import { SignOutButton } from "@/components/SignOutButton"

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-semibold text-gray-900">
          Community Center
        </Link>
        <Link href="/my-registrations" className="text-sm text-gray-600 hover:text-gray-900">
          My Registrations
        </Link>
        <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
          Profile
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-gray-700">{session.user.name}</span>
              <SignOutButton className="text-sm text-gray-600 hover:text-gray-900" />
            </>
          ) : (
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

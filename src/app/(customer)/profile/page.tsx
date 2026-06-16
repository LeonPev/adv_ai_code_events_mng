import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage() {
  const session = await getServerSession()
  if (!session) redirect("/auth/login?callbackUrl=/profile")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/auth/login")

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      <ProfileForm
        email={user.email}
        fullName={user.fullName}
        phone={user.phone}
        dateOfBirth={user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null}
      />
    </div>
  )
}

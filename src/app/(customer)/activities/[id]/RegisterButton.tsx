"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { registerForActivity } from "./actions"

interface RegisterButtonProps {
  activityId: string
  isLoggedIn: boolean
  alreadyRegistered: boolean
  full: boolean
}

export function RegisterButton({ activityId, isLoggedIn, alreadyRegistered, full }: RegisterButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!isLoggedIn) {
    return (
      <a
        href={`/auth/login?callbackUrl=/activities/${activityId}`}
        className="inline-block px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        Sign in to register
      </a>
    )
  }

  if (alreadyRegistered) {
    return <p className="text-sm text-green-700 font-medium">You are already registered.</p>
  }

  if (full) {
    return (
      <div>
        <button disabled className="px-4 py-2 text-sm rounded-md bg-gray-300 text-gray-500 cursor-not-allowed">
          Register
        </button>
        <p className="text-sm text-red-600 mt-1">This activity is full.</p>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setError(null)
          const result = await registerForActivity(activityId)
          setPending(false)
          if ("error" in result) setError(result.error)
          else router.push(`/my-registrations/${result.registrationId}`)
        }}
        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Registering…" : "Register"}
      </button>
    </div>
  )
}

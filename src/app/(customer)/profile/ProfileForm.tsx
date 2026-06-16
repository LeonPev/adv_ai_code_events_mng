"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateProfile } from "./actions"

interface ProfileFormProps {
  email: string
  fullName: string
  phone: string | null
  dateOfBirth: string | null // yyyy-mm-dd
}

export function ProfileForm({ email, fullName, phone, dateOfBirth }: ProfileFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    setSuccess(false)
    const result = await updateProfile(formData)
    setPending(false)
    if ("error" in result) setError(result.error)
    else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 max-w-md space-y-4">
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">Profile updated.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input value={email} disabled className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          name="fullName"
          defaultValue={fullName}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          name="phone"
          defaultValue={phone ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
        <input
          name="dateOfBirth"
          type="date"
          defaultValue={dateOfBirth ?? ""}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <p className="text-sm font-medium text-gray-700">Payment Method</p>
        <p className="text-xs text-gray-500">Coming soon.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  )
}

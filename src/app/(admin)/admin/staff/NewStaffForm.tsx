"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createStaff } from "./actions"

export function NewStaffForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await createStaff(formData)
    setPending(false)
    if ("error" in result) setError(result.error)
    else {
      setTempPassword(result.tempPassword)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        New Staff
      </button>
    )
  }

  if (tempPassword) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-md p-4 max-w-md">
        <p className="text-sm font-medium text-amber-900 mb-1">Staff account created.</p>
        <p className="text-sm text-amber-800">
          Temporary password (shown once): <span className="font-mono font-bold">{tempPassword}</span>
        </p>
        <button
          onClick={() => {
            setTempPassword(null)
            setOpen(false)
          }}
          className="mt-3 px-3 py-1.5 text-sm rounded-md border border-amber-300 hover:bg-amber-100"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="bg-white border border-gray-200 rounded-md p-4 max-w-md space-y-3"
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input name="fullName" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input name="email" type="email" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select name="role" defaultValue="OPERATOR" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="OPERATOR">Operator</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300">
          Cancel
        </button>
      </div>
    </form>
  )
}

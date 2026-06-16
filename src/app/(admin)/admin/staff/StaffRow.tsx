"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { updateStaff, deactivateStaff, reactivateStaff } from "./actions"

interface StaffRowProps {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  isSelf: boolean
}

export function StaffRow({ id, fullName, email, role, status, isSelf }: StaffRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (editing) {
    return (
      <tr className="border-t border-gray-100">
        <td colSpan={5} className="px-4 py-2">
          <form
            action={async (formData) => {
              const result = await updateStaff(id, formData)
              if ("error" in result) setError(result.error)
              else {
                setEditing(false)
                router.refresh()
              }
            }}
            className="flex flex-wrap items-end gap-2"
          >
            {error && <p className="text-sm text-red-600 w-full">{error}</p>}
            <input name="fullName" defaultValue={fullName} className="border border-gray-300 rounded-md px-2 py-1 text-sm" />
            <select name="role" defaultValue={role} className="border border-gray-300 rounded-md px-2 py-1 text-sm">
              <option value="OPERATOR">Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="px-2 py-1 text-sm rounded-md bg-blue-600 text-white">
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 text-sm rounded-md border border-gray-300">
              Cancel
            </button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-2">{fullName}</td>
      <td className="px-4 py-2">{email}</td>
      <td className="px-4 py-2">{role}</td>
      <td className="px-4 py-2">
        <Badge tone={status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}>{status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
      </td>
      <td className="px-4 py-2 text-right space-x-2">
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline">
          Edit
        </button>
        {status === "ACTIVE" ? (
          <button
            disabled={isSelf}
            title={isSelf ? "You cannot deactivate yourself." : undefined}
            onClick={async () => {
              const result = await deactivateStaff(id)
              if ("error" in result) setError(result.error)
              else router.refresh()
            }}
            className="text-red-600 hover:underline disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={async () => {
              await reactivateStaff(id)
              router.refresh()
            }}
            className="text-blue-600 hover:underline"
          >
            Reactivate
          </button>
        )}
      </td>
    </tr>
  )
}

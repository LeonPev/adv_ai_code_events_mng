"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

interface ActivityOption {
  id: string
  name: string
  spotsLeft: number
}

type RegisterResult = { error: string } | { success: true; registrationId: string }

interface AdminRegisterFormProps {
  customerId: string
  activities: ActivityOption[]
  registerAction: (activityId: string, customerId: string) => Promise<RegisterResult>
}

export function AdminRegisterForm({ customerId, activities, registerAction }: AdminRegisterFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const filtered = useMemo(
    () => activities.filter((a) => a.name.toLowerCase().includes(query.toLowerCase())),
    [activities, query]
  )

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Register for Activity</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search activities…"
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
      />
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filtered.map((a) => (
          <label key={a.id} className="flex items-center gap-2 text-sm">
            <input type="radio" name="activity" checked={selected === a.id} onChange={() => setSelected(a.id)} />
            {a.name} ({a.spotsLeft} spots left)
          </label>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500">No matching activities.</p>}
      </div>
      <button
        disabled={!selected || pending}
        onClick={async () => {
          if (!selected) return
          setPending(true)
          setError(null)
          const result = await registerAction(selected, customerId)
          setPending(false)
          if ("error" in result) setError(result.error)
          else {
            setSelected(null)
            router.refresh()
          }
        }}
        className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Registering…" : "Register"}
      </button>
    </div>
  )
}

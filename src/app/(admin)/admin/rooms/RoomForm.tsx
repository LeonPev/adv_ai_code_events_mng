"use client"

import { useState } from "react"

interface RoomFormValues {
  name: string
  type: string
  capacity: number
  description: string | null
}

interface RoomFormProps {
  initial?: RoomFormValues
  action: (formData: FormData) => Promise<{ error: string } | { success: true }>
}

const ROOM_TYPES = ["CLASSROOM", "ART_STUDIO", "AUDITORIUM"]

export function RoomForm({ initial, action }: RoomFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await action(formData)
    setPending(false)
    if ("error" in result) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          name="name"
          defaultValue={initial?.name}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          name="type"
          defaultValue={initial?.type ?? ROOM_TYPES[0]}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
        <input
          name="capacity"
          type="number"
          min={1}
          defaultValue={initial?.capacity}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
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

"use client"

import { useState } from "react"

export interface ActivityFormValues {
  name: string
  type: string
  description: string
  capacity: number
  pricePlaceholder: number | null
  roomId: string
  status: string
  startDatetime: Date | null
  endDatetime: Date | null
}

interface RoomOption {
  id: string
  name: string
}

interface ActivityFormProps {
  initial?: ActivityFormValues
  rooms: RoomOption[]
  /** Type is fixed once created. */
  lockType?: boolean
  action: (formData: FormData) => Promise<{ error: string } | { success: true } | void>
}

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ActivityForm({ initial, rooms, lockType, action }: ActivityFormProps) {
  const [type, setType] = useState(initial?.type ?? "EVENT")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await action(formData)
    setPending(false)
    if (result && "error" in result) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Type</h3>
        <div className="flex gap-4">
          {["EVENT", "SEMINAR", "COURSE"].map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                disabled={lockType}
                onChange={() => setType(t)}
              />
              {t}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Details</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={initial?.description}
            required
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (placeholder)</label>
            <input
              name="pricePlaceholder"
              type="number"
              step="0.01"
              min={0}
              defaultValue={initial?.pricePlaceholder ?? ""}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {type !== "COURSE" && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Schedule</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                name="startDatetime"
                type="datetime-local"
                defaultValue={toLocalInput(initial?.startDatetime)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                name="endDatetime"
                type="datetime-local"
                defaultValue={toLocalInput(initial?.endDatetime)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>
      )}
      {type === "COURSE" && (
        <p className="text-sm text-gray-500">
          Course sessions are added after the course is created.
        </p>
      )}

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Room</h3>
        <select
          name="roomId"
          defaultValue={initial?.roomId}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select a room…
          </option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
        <select
          name="status"
          defaultValue={initial?.status ?? "DRAFT"}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </section>

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

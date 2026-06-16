"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type ActionResult = { error: string } | { success: true }

interface RoomOption {
  id: string
  name: string
}

export interface CourseSessionRow {
  id: string
  sessionNumber: number
  startDatetime: string
  endDatetime: string
  roomId: string
  roomName: string
}

interface CourseSessionsSectionProps {
  courseId: string
  rooms: RoomOption[]
  sessions: CourseSessionRow[]
  addAction: (courseId: string, formData: FormData) => Promise<ActionResult>
  updateAction: (sessionId: string, courseId: string, formData: FormData) => Promise<ActionResult>
  deleteAction: (sessionId: string) => Promise<ActionResult>
}

function SessionForm({
  rooms,
  initial,
  onSubmit,
  onCancel,
}: {
  rooms: RoomOption[]
  initial?: Partial<CourseSessionRow>
  onSubmit: (formData: FormData) => Promise<void>
  onCancel?: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      action={async (formData) => {
        setPending(true)
        setError(null)
        try {
          await onSubmit(formData)
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong.")
        } finally {
          setPending(false)
        }
      }}
      className="flex flex-wrap items-end gap-2 bg-gray-50 border border-gray-200 rounded-md p-3"
    >
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
      <div>
        <label className="block text-xs text-gray-500 mb-1">#</label>
        <input
          name="sessionNumber"
          type="number"
          min={1}
          defaultValue={initial?.sessionNumber}
          required
          className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Start</label>
        <input
          name="startDatetime"
          type="datetime-local"
          defaultValue={initial?.startDatetime}
          required
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">End</label>
        <input
          name="endDatetime"
          type="datetime-local"
          defaultValue={initial?.endDatetime}
          required
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Room</label>
        <select
          name="roomId"
          defaultValue={initial?.roomId}
          required
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Select…
          </option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm rounded-md border border-gray-300">
          Cancel
        </button>
      )}
    </form>
  )
}

export function CourseSessionsSection({
  courseId,
  rooms,
  sessions,
  addAction,
  updateAction,
  deleteAction,
}: CourseSessionsSectionProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleAdd(formData: FormData) {
    const result = await addAction(courseId, formData)
    if ("error" in result) throw new Error(result.error)
    setAdding(false)
    router.refresh()
  }

  async function handleUpdate(sessionId: string, formData: FormData) {
    const result = await updateAction(sessionId, courseId, formData)
    if ("error" in result) throw new Error(result.error)
    setEditingId(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Course Sessions</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Add Session
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sessions
          .sort((a, b) => a.sessionNumber - b.sessionNumber)
          .map((s) =>
            editingId === s.id ? (
              <SessionForm
                key={s.id}
                rooms={rooms}
                initial={s}
                onCancel={() => setEditingId(null)}
                onSubmit={(formData) => handleUpdate(s.id, formData)}
              />
            ) : (
              <div
                key={s.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <span>
                  #{s.sessionNumber} — {new Date(s.startDatetime).toLocaleString()} to{" "}
                  {new Date(s.endDatetime).toLocaleString()} — {s.roomName}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(s.id)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <ConfirmDialog
                    title="Delete session?"
                    description="This session will be permanently removed."
                    confirmLabel="Delete"
                    trigger={(open) => (
                      <button onClick={open} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    )}
                    onConfirm={async () => {
                      const result = await deleteAction(s.id)
                      if ("error" in result) throw new Error(result.error)
                      router.refresh()
                    }}
                  />
                </div>
              </div>
            )
          )}
        {sessions.length === 0 && !adding && <p className="text-sm text-gray-500">No sessions yet.</p>}
        {adding && <SessionForm rooms={rooms} onCancel={() => setAdding(false)} onSubmit={handleAdd} />}
      </div>
    </div>
  )
}

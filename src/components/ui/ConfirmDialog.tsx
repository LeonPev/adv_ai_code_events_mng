"use client"

import { useState } from "react"

interface ConfirmDialogProps {
  /** Trigger element renderer; receives an onClick handler that opens the dialog. */
  trigger: (open: () => void) => React.ReactNode
  title: string
  description: React.ReactNode
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
            <div className="text-sm text-gray-600 mb-4">{description}</div>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className={`px-3 py-1.5 text-sm rounded-md text-white ${
                  danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                } disabled:opacity-50`}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

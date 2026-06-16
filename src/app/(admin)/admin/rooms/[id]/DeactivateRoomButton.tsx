"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type ActionResult = { error: string } | { success: true }

interface DeactivateRoomButtonProps {
  roomId: string
  isActive: boolean
  deactivateAction: (roomId: string) => Promise<ActionResult>
  reactivateAction: (roomId: string) => Promise<ActionResult>
}

export function DeactivateRoomButton({
  roomId,
  isActive,
  deactivateAction,
  reactivateAction,
}: DeactivateRoomButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  if (!isActive) {
    return (
      <button
        onClick={async () => {
          const result = await reactivateAction(roomId)
          if ("error" in result) setError(result.error)
          else router.refresh()
        }}
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Reactivate
      </button>
    )
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <ConfirmDialog
        title="Deactivate room?"
        description="This room will no longer be available for new bookings."
        confirmLabel="Deactivate"
        trigger={(open) => (
          <button
            onClick={open}
            className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
          >
            Deactivate
          </button>
        )}
        onConfirm={async () => {
          const result = await deactivateAction(roomId)
          if ("error" in result) {
            setError(result.error)
            throw new Error(result.error)
          }
          router.refresh()
        }}
      />
    </div>
  )
}

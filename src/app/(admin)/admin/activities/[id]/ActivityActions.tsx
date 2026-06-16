"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type ActionResult = { error: string } | { success: true }

interface ActivityActionsProps {
  activityId: string
  status: string
  activeRegistrationCount: number
  publishAction: (activityId: string) => Promise<ActionResult>
  cancelAction: (activityId: string) => Promise<ActionResult | void>
}

export function ActivityActions({
  activityId,
  status,
  activeRegistrationCount,
  publishAction,
  cancelAction,
}: ActivityActionsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {status === "DRAFT" && (
        <button
          onClick={async () => {
            const result = await publishAction(activityId)
            if ("error" in result) setError(result.error)
            else router.refresh()
          }}
          className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
        >
          Publish
        </button>
      )}
      {status !== "CANCELLED" && (
        <ConfirmDialog
          title="Cancel activity?"
          description={`This will cancel ${activeRegistrationCount} active registration${activeRegistrationCount === 1 ? "" : "s"}. Are you sure?`}
          confirmLabel="Cancel Activity"
          trigger={(open) => (
            <button
              onClick={open}
              className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
            >
              Cancel Activity
            </button>
          )}
          onConfirm={async () => {
            await cancelAction(activityId)
          }}
        />
      )}
    </div>
  )
}

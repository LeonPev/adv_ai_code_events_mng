"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { cancelRegistration } from "./actions"

export function CancelRegistrationButton({ registrationId }: { registrationId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <ConfirmDialog
        title="Cancel registration?"
        description="Are you sure? This cannot be undone."
        confirmLabel="Cancel Registration"
        trigger={(open) => (
          <button
            onClick={open}
            className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
          >
            Cancel Registration
          </button>
        )}
        onConfirm={async () => {
          const result = await cancelRegistration(registrationId)
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

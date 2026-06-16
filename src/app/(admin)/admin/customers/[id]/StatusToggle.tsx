"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type ActionResult = { error: string } | { success: true }

interface StatusToggleProps {
  customerId: string
  status: string
  activeRegistrationCount: number
  action: (customerId: string) => Promise<ActionResult>
}

export function StatusToggle({ customerId, status, activeRegistrationCount, action }: StatusToggleProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  if (status === "SUSPENDED") {
    return (
      <button
        onClick={async () => {
          const result = await action(customerId)
          if ("error" in result) setError(result.error)
          else router.refresh()
        }}
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
      >
        Reactivate
      </button>
    )
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <ConfirmDialog
        title="Suspend customer?"
        description={
          activeRegistrationCount > 0
            ? `This customer has ${activeRegistrationCount} active registration${activeRegistrationCount === 1 ? "" : "s"}. Suspending will not cancel them.`
            : "This customer will no longer be able to log in."
        }
        confirmLabel="Suspend"
        trigger={(open) => (
          <button
            onClick={open}
            className="px-3 py-1.5 text-sm rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            Suspend
          </button>
        )}
        onConfirm={async () => {
          const result = await action(customerId)
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

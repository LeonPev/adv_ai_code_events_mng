"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { ManualLookup } from "./ManualLookup"

interface ScannerProps {
  eventId: string
  eventName: string
  eventDate: string
  initialCheckedIn: number
  capacity: number
  disabled: boolean
}

interface ScanFeedback {
  ok: boolean
  message: string
}

const READER_ID = "qr-reader"

export function Scanner({ eventId, eventName, eventDate, initialCheckedIn, capacity, disabled }: ScannerProps) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (disabled) return

    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (busyRef.current) return
          busyRef.current = true
          await handleScan(decodedText)
          busyRef.current = false
        },
        () => {
          /* ignore per-frame decode failures */
        }
      )
      .catch(() => {
        setFeedback({ ok: false, message: "Could not access the camera." })
      })

    return () => {
      scanner.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [feedback])

  async function handleScan(qrToken: string) {
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken, eventId }),
      })
      const data = await res.json()
      if (data.ok) {
        setCheckedIn((c) => c + 1)
        setFeedback({ ok: true, message: `Checked in: ${data.customerName}` })
      } else {
        setFeedback({ ok: false, message: data.message ?? "Check-in failed." })
      }
    } catch {
      setFeedback({ ok: false, message: "Network error — could not reach the server." })
    }
  }

  if (disabled) {
    return (
      <div className="bg-red-900/40 border border-red-700 rounded-lg p-6 text-center">
        <p className="font-semibold">This event has been cancelled.</p>
        <p className="text-sm text-gray-400 mt-1">Scanning is disabled.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold">{eventName}</p>
          <p className="text-sm text-gray-400">{eventDate}</p>
        </div>
        <p className="text-lg font-bold">
          {checkedIn} / {capacity} checked in
        </p>
      </div>

      {feedback && (
        <div
          className={`w-full text-center py-3 rounded-md mb-4 font-medium ${
            feedback.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div id={READER_ID} className="rounded-lg overflow-hidden bg-black" />

      <button
        onClick={() => setManualOpen(true)}
        className="mt-4 w-full px-4 py-2 text-sm rounded-md border border-gray-600 hover:bg-gray-800"
      >
        Manual Lookup
      </button>

      {manualOpen && (
        <ManualLookup
          eventId={eventId}
          onClose={() => setManualOpen(false)}
          onCheckedIn={() => setCheckedIn((c) => c + 1)}
        />
      )}
    </div>
  )
}

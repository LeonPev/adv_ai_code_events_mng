"use client"

import { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"

interface QrSectionProps {
  registrationId: string
  qrToken: string
}

export function QrSection({ registrationId, qrToken }: QrSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const canvas = containerRef.current?.querySelector("canvas")
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `registration-${registrationId}.png`
    a.click()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 text-center">
      <div ref={containerRef} className="flex justify-center mb-3">
        <QRCodeCanvas value={qrToken} size={256} />
      </div>
      <p className="text-xs text-gray-400 mb-3">Registration ID: {registrationId}</p>
      <button
        onClick={handleDownload}
        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
      >
        Download QR
      </button>
    </div>
  )
}

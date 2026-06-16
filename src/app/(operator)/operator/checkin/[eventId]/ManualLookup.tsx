"use client"

import { useEffect, useState } from "react"
import { markAttended } from "./actions"

interface SearchResult {
  registrationId: string
  customerName: string
  checkedInAt: string | null
}

interface ManualLookupProps {
  eventId: string
  onClose: () => void
  onCheckedIn: () => void
}

export function ManualLookup({ eventId, onClose, onCheckedIn }: ManualLookupProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/checkin/search?name=${encodeURIComponent(query)}&eventId=${eventId}`)
      const data = await res.json()
      setResults(data.results ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [query, eventId])

  async function handleMark(registrationId: string) {
    setMarking(registrationId)
    setError(null)
    const result = await markAttended(registrationId, eventId)
    setMarking(null)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onCheckedIn()
    setResults((rs) =>
      rs.map((r) => (r.registrationId === registrationId ? { ...r, checkedInAt: new Date().toISOString() } : r))
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Manual Lookup</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full border border-gray-600 bg-gray-900 rounded-md px-3 py-2 text-sm mb-3"
        />
        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <div key={r.registrationId} className="flex items-center justify-between bg-gray-900 rounded-md px-3 py-2">
              <span className="text-sm">{r.customerName}</span>
              {r.checkedInAt ? (
                <span className="text-xs text-gray-400">
                  Already checked in at{" "}
                  {new Date(r.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : (
                <button
                  onClick={() => handleMark(r.registrationId)}
                  disabled={marking === r.registrationId}
                  className="px-2 py-1 text-xs rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {marking === r.registrationId ? "Marking…" : "Mark as Attended"}
                </button>
              )}
            </div>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="text-sm text-gray-400">No matching registrations.</p>
          )}
        </div>
      </div>
    </div>
  )
}

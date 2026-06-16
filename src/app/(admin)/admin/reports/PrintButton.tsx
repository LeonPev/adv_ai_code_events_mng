"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 print:hidden"
    >
      Export PDF
    </button>
  )
}

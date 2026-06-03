export default function CheckInScannerPage({ params }: { params: { eventId: string } }) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-2">Check-In Scanner</h1>
      <p className="text-gray-400 text-sm">
        Screen O-03 — QR Scanner. Event: {params.eventId}. Placeholder.
      </p>
    </div>
  )
}

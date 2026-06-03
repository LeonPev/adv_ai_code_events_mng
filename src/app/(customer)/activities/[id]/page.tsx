export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Detail</h1>
      <p className="text-gray-500 text-sm">
        Screen C-02 — Activity Detail. ID: {params.id}. Placeholder.
      </p>
    </div>
  )
}

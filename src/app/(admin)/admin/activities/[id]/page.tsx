export default function ActivityDetailAdminPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Detail / Edit</h1>
      <p className="text-gray-500 text-sm">Screen A-03 — Activity Detail. ID: {params.id}. Placeholder.</p>
    </div>
  )
}

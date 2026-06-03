export default function RegistrationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Detail</h1>
      <p className="text-gray-500 text-sm">
        Screen C-05 — Registration Detail + QR Code. ID: {params.id}. Placeholder.
      </p>
    </div>
  )
}

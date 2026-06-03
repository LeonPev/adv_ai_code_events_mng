export default function RegistrationDetailAdminPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Detail</h1>
      <p className="text-gray-500 text-sm">Screen A-10 — Registration Detail. ID: {params.id}. Placeholder.</p>
    </div>
  )
}

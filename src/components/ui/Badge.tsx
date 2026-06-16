const COLORS: Record<string, string> = {
  // Activity / registration status
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-amber-100 text-amber-800",
  INACTIVE: "bg-gray-100 text-gray-500",
  // Activity type
  EVENT: "bg-blue-100 text-blue-700",
  SEMINAR: "bg-purple-100 text-purple-700",
  COURSE: "bg-teal-100 text-teal-700",
  // Misc
  FULL: "bg-red-100 text-red-700",
  WARNING: "bg-amber-100 text-amber-800",
}

export function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const color = (tone && COLORS[tone]) || "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  )
}

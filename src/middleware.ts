export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/admin/:path*",
    "/operator/:path*",
    "/my-registrations/:path*",
    "/profile/:path*",
  ],
}

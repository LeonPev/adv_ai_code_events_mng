export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Forgot Password?</h1>
        <p className="text-gray-600 text-sm">
          Password resets are not automated. Please contact admin to have your password reset.
        </p>
        <p className="mt-6">
          <a href="/auth/login" className="text-blue-600 hover:underline text-sm">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}

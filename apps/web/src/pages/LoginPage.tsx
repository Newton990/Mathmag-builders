// Login placeholder page — Step 3 will wire up real authentication
export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mathmag Builders</h1>
          <p className="text-sm text-gray-500 mt-1">Management System</p>
        </div>

        <form className="space-y-4" aria-label="Login form">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@mathmag.co.ke"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-700 hover:bg-brand-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Authentication coming in Step 3
        </p>
      </div>
    </div>
  );
}

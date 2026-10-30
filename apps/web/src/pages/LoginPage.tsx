// src/pages/LoginPage.tsx
// Real sign-in: password first, then TOTP only when the account has MFA.
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeForRole, useAuth } from '../auth/AuthContext';
import { ErrorBanner, buttonClass, inputClass } from '../components/ui';

export function LoginPage() {
  const { user, mfaToken, login, verifyMfa, cancelMfa, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate(homeForRole(user.role), { replace: true });
  }, [user, navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await login(email.trim(), password);
    } catch {
      // The auth context exposes a readable message.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await verifyMfa(code.trim());
    } catch {
      // The auth context exposes a readable message.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Mathmag Builders</h1>
          <p className="mt-1 text-sm text-gray-500">Management System</p>
        </div>

        <ErrorBanner message={localError ?? error} />

        {mfaToken ? (
          <form className="space-y-4" onSubmit={handleMfa} aria-label="MFA form">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app. If you have lost access,
              contact management — MFA is never bypassed by the portal.
            </p>
            <label htmlFor="mfa-code" className="block text-sm font-medium text-gray-700">
              Authentication code
            </label>
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              className={`${inputClass} tracking-[0.4em]`}
              placeholder="123456"
            />
            <button type="submit" disabled={submitting} className={`${buttonClass} w-full`}>
              {submitting ? 'Verifying…' : 'Verify and continue'}
            </button>
            <button
              type="button"
              onClick={cancelMfa}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleLogin} aria-label="Login form">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@mathmag.co.ke"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={submitting} className={`${buttonClass} w-full`}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Access is role-based and every critical action is audited.
        </p>
      </div>
    </div>
  );
}

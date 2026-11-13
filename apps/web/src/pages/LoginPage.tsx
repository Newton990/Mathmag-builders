// src/pages/LoginPage.tsx
// Smart login page — shows three portal cards so users self-identify before
// signing in. After authentication the app automatically redirects to the
// correct dashboard based on the user's server-assigned role.
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeForRole, useAuth } from '../auth/AuthContext';
import { ErrorBanner, buttonClass, inputClass } from '../components/ui';

// ─── Portal definitions ───────────────────────────────────────────────────────
// Each card maps to a group of roles that land on the same dashboard.
const PORTALS = [
  {
    id: 'staff',
    label: 'Staff Portal',
    description: 'Lead & Junior Architects, Client Relations Officers, Management',
    icon: '🏗️',
    accent: 'border-brand-600 bg-brand-50',
    accentText: 'text-brand-700',
    placeholder: 'you@mathmag.co.ke',
    demoLabel: 'Demo as Lead Architect',
    demoRole: 'LEAD_ARCHITECT' as const,
  },
  {
    id: 'field',
    label: 'Field Officer App',
    description: 'Visiting Officers conducting site surveys and assessments',
    icon: '📋',
    accent: 'border-emerald-600 bg-emerald-50',
    accentText: 'text-emerald-700',
    placeholder: 'officer@mathmag.co.ke',
    demoLabel: 'Demo as Field Officer',
    demoRole: 'VISITING_OFFICER' as const,
  },
  {
    id: 'portal',
    label: 'Client Portal',
    description: 'Clients tracking their construction project progress',
    icon: '🏠',
    accent: 'border-violet-600 bg-violet-50',
    accentText: 'text-violet-700',
    placeholder: 'client@email.com',
    demoLabel: 'Demo as Client',
    demoRole: 'CLIENT' as const,
  },
] as const;

const PRODUCT_HIGHLIGHTS = [
  'Enquiry to project flow',
  'Audit-ready approvals',
  'Client visibility at every stage',
] as const;

type PortalId = (typeof PORTALS)[number]['id'];

// ─── Component ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { user, mfaToken, login, verifyMfa, cancelMfa, error, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<PortalId | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect authenticated users to their home dashboard immediately.
  useEffect(() => {
    if (user) navigate(homeForRole(user.role), { replace: true });
  }, [user, navigate]);

  const portal = PORTALS.find((p) => p.id === selected) ?? null;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      // Error is surfaced via the auth context.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await verifyMfa(code.trim());
    } catch {
      // Error is surfaced via the auth context.
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    if (!portal) return;
    setSubmitting(true);
    try {
      await loginAsDemo(portal.demoRole);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-900 to-brand-700 p-4">
      {/* Header */}
      <div className="mb-6 text-center text-white">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-brand-100 uppercase backdrop-blur-sm">
          Demo workspace
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Mathmag Builders</h1>
        <p className="mt-2 text-brand-100">Construction delivery management system</p>
      </div>

      <div className="mb-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-brand-950/20 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          {PRODUCT_HIGHLIGHTS.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-brand-50"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Step 1: Portal selection ──────────────────────────────────────── */}
      {!selected && (
        <div className="w-full max-w-2xl">
          <p className="mb-4 text-center text-sm font-medium text-brand-200 uppercase tracking-widest">
            Select your portal to continue
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {PORTALS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`group flex flex-col items-center rounded-3xl border-2 bg-white p-5 text-center shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99] ${p.accent}`}
                data-help={`Sign in to the ${p.label}. ${p.description}.`}
                title={`Open the ${p.label} — ${p.description}`}
                aria-label={`Open the ${p.label} portal`}
              >
                <span className="mb-3 text-4xl drop-shadow-sm">{p.icon}</span>
                <span className={`text-base font-semibold ${p.accentText}`}>{p.label}</span>
                <span className="mt-2 text-xs text-gray-500 leading-snug">{p.description}</span>
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-brand-300">
            Access is role-based — the system routes you automatically after sign-in.
          </p>
        </div>
      )}

      {/* ── Step 2: Sign-in form ──────────────────────────────────────────── */}
      {selected && portal && (
        <div className="w-full max-w-sm">
          {/* Back link */}
          <button
            type="button"
            onClick={() => { setSelected(null); setEmail(''); setPassword(''); }}
            className="mb-4 flex items-center gap-1 text-sm text-brand-200 hover:text-white transition-colors"
            title="Return to the portal selection page and choose another role"
            aria-label="Return to portal selection"
          >
            ← Back to portal selection
          </button>

          <div className="rounded-2xl bg-white p-8 shadow-xl">
            {/* Portal badge */}
            <div className={`mb-5 flex items-center gap-2 rounded-xl border-2 p-3 ${portal.accent}`}>
              <span className="text-2xl">{portal.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${portal.accentText}`}>{portal.label}</p>
                <p className="text-xs text-gray-500">Sign in with your MBMS credentials</p>
              </div>
            </div>

            <ErrorBanner message={error} />

            {/* ── MFA step ── */}
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
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
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
                  title="Return to the previous sign-in form without verifying the MFA code"
                  aria-label="Return to sign in"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              /* ── Password step ── */
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={portal.placeholder}
                    className={inputClass}
                    data-help="Enter your MBMS account email address."
                    data-help-example={portal.placeholder}
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
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <button type="submit" disabled={submitting} className={`${buttonClass} w-full`}
                  data-help="Submit your email and password to sign in. You will be taken directly to your role's dashboard."
                  title={`Sign in to ${portal.label} using your MBMS email and password`}
                  aria-label={`Sign in to ${portal.label}`}
                >
                  {submitting ? 'Signing in…' : `Sign in to ${portal.label}`}
                </button>

                {/* Demo shortcut */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400">or try without an account</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDemo}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  data-help={`Try the ${portal.label} instantly with example data — no account needed. Perfect for exploring the platform.`}
                  title={`Open a demo version of the ${portal.label} with example project data`}
                  aria-label={`Open demo for ${portal.label}`}
                >
                  {portal.demoLabel}
                </button>
              </form>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-brand-300">
            Access is role-based and every critical action is audited.
          </p>
        </div>
      )}
    </div>
  );
}

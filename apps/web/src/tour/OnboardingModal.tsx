import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { completeGuide, hasCompletedGuide } from './onboarding';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    title: 'Welcome to MBMS',
    body: 'This is your project workspace for Mathmag Builders. You can quickly review work, publication status, and operational tasks from one place.',
  },
  {
    title: 'Use the sidebar',
    body: 'Navigation is organized by role. Staff work in operations, field officers manage site visits, and clients review approved project updates.',
  },
  {
    title: 'Stay in control',
    body: 'Every important action is visible, tracked, and audit-ready so the project record remains accurate and secure.',
  },
] as const;

export function OnboardingModal() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  if (!user || hasCompletedGuide(user.role)) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const roleLabel = useMemo(() => {
    if (user.role === 'CLIENT') return 'Client portal';
    if (user.role === 'VISITING_OFFICER') return 'Field app';
    return 'Staff workspace';
  }, [user.role]);

  function finish() {
    completeGuide(user.role);
    setStep(0);
  }

  return (
    <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-brand-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200">First-time setup</p>
              <h2 className="mt-2 text-2xl font-bold">{roleLabel}</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/staff/guide')}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
              title="Open user guide"
              aria-label="Open user guide"
            >
              ?
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex items-center gap-2">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-2.5 flex-1 rounded-full ${index === step ? 'bg-brand-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <h3 className="text-xl font-semibold text-gray-900">{current.title}</h3>
          <p className="mt-3 text-sm leading-6 text-gray-600">{current.body}</p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            {step === 0 ? (
              <button
                type="button"
                onClick={finish}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex-1 sm:flex-1"
                title="Skip onboarding and open the app dashboard"
                aria-label="Skip onboarding and open the app dashboard"
              >
                Skip guide
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex-1 sm:flex-1"
                  title="Go back to the previous onboarding step"
                  aria-label="Go back to the previous onboarding step"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex-1 sm:flex-1"
                  title="Skip onboarding and open the app dashboard"
                  aria-label="Skip onboarding and open the app dashboard"
                >
                  Skip guide
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) finish();
                else setStep((value) => value + 1);
              }}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 flex-1 sm:flex-1"
              title={isLast ? 'Finish onboarding and open the app dashboard' : 'Move to the next onboarding step'}
              aria-label={isLast ? 'Finish onboarding and open the app' : 'Move to the next onboarding step'}
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

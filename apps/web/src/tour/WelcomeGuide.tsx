// src/tour/WelcomeGuide.tsx
// Full-screen welcome guide modal that opens on first sign-in.
// Shows role description, chapter-by-chapter how-to, and permissions table.
// After closing, hands off to the spotlight TourOverlay.
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { completeGuide, hasCompletedGuide } from './onboarding';
import { guideForRole } from './guideContent';
import { useTour } from './TourContext';

export function WelcomeGuide() {
  const { user } = useAuth();
  const { restart: startSpotlight } = useTour();

  const [open, setOpen] = useState(false);
  type Tab = 'overview' | number | 'permissions';
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!user) return;
    if (!hasCompletedGuide(user.role)) setOpen(true);
  }, [user]);

  if (!open || !user) return null;

  const guide = guideForRole(user.role);
  const totalChapters = guide.chapters?.length ?? 0;

  function finish() {
    completeGuide(user.role);
    setOpen(false);
    // Kick off the spotlight tour after a brief delay
    setTimeout(() => startSpotlight(), 400);
  }

  function skip() {
    completeGuide(user.role);
    setOpen(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: '👋 Overview' },
    ...(guide.chapters ?? []).map((c, i) => ({ id: i as Tab, label: c.icon + ' ' + c.title.replace(/Step \d+ — /, '') })),
    { id: 'permissions', label: '🔐 Permissions' },
  ];

  const currentChapter = typeof tab === 'number' ? guide.chapters?.[tab] : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-label="Welcome guide"
      aria-modal="true"
    >
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh]">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className={`${guide.roleColor} px-6 py-5 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{guide.welcomeTitle}</h1>
              <p className="mt-1 text-sm opacity-90">{guide.welcomeSubtitle}</p>
            </div>
            <button
              onClick={skip}
              className="ml-4 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30"
            >
              Skip guide
            </button>
          </div>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────────── */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 px-2">
          {tabs.map((t) => (
            <button
              key={String(t.id)}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                tab === t.id
                  ? 'border-brand-600 text-brand-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Who you are</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{guide.whoYouAre}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">What you do day-to-day</h2>
                <p className="text-sm text-gray-700 leading-relaxed">{guide.whatYouDo}</p>
              </div>

              <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
                <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-2">📖 Example scenario</h2>
                <p className="text-sm text-brand-800 leading-relaxed">{guide.exampleScenario}</p>
              </div>

              {guide.demoCredentials && (
                <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
                  <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">🔑 Demo credentials</h2>
                  <div className="font-mono text-xs text-amber-900 space-y-1">
                    <p>Email: <span className="font-semibold">{guide.demoCredentials.email}</span></p>
                    <p>Password: <span className="font-semibold">{guide.demoCredentials.password}</span></p>
                  </div>
                  <p className="mt-2 text-xs text-amber-700">{guide.demoCredentials.note}</p>
                </div>
              )}

              {guide.chapters && guide.chapters.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Your how-to chapters</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {guide.chapters.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setTab(i)}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-brand-300 hover:bg-brand-50 transition-colors"
                      >
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{c.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chapter tabs */}
          {currentChapter && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{currentChapter.icon}</span>
                  <h2 className="text-lg font-bold text-gray-900">{currentChapter.title}</h2>
                </div>
                <p className="text-sm text-gray-600">{currentChapter.description}</p>
              </div>

              <div className="space-y-3">
                {currentChapter.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
                  >
                    {/* Step number */}
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="text-sm font-semibold text-gray-800">{step.action}</span>
                        <span className="text-sm text-brand-700 font-medium">{step.where}</span>
                      </div>
                      {step.example && (
                        <div className="mt-1.5 rounded-lg bg-white border border-gray-200 px-3 py-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Example</p>
                          <p className="text-xs font-mono text-gray-700 leading-relaxed">{step.example}</p>
                        </div>
                      )}
                      {step.tip && (
                        <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                          💡 {step.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions tab */}
          {tab === 'permissions' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your access is enforced server-side — these restrictions cannot be bypassed by the UI.
              </p>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {guide.permissions.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 ${p.allowed ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <span className={`flex-shrink-0 text-lg ${p.allowed ? 'text-green-500' : 'text-red-400'}`}>
                      {p.allowed ? '✅' : '🚫'}
                    </span>
                    <span className={`text-sm ${p.allowed ? 'text-gray-800' : 'text-gray-500'}`}>
                      {p.label}
                    </span>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.allowed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {p.allowed ? 'Allowed' : 'Restricted'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-600 leading-relaxed space-y-1">
                <p>🔒 <strong>Approval & publication</strong> are always separate, audited actions.</p>
                <p>📜 <strong>Approved / published records</strong> are immutable — edits create new versions.</p>
                <p>🌍 <strong>Clients</strong> only ever see content explicitly published for their own project.</p>
                <p>📋 <strong>Every critical action</strong> writes an append-only audit event with timestamp and user ID.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p className="text-xs text-gray-400">
            {typeof tab === 'number'
              ? `Chapter ${(tab as number) + 1} of ${totalChapters}`
              : tab === 'permissions'
              ? 'Your role permissions'
              : 'Overview'}
          </p>
          <div className="flex items-center gap-3">
            {tab !== 'overview' && (
              <button
                onClick={() => setTab('overview')}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white"
              >
                ← Overview
              </button>
            )}
            <button
              onClick={finish}
              className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${guide.roleColor} hover:opacity-90`}
            >
              Got it — start the tour 🎯
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

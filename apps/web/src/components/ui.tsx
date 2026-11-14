// src/components/ui.tsx
// Small presentational building blocks shared by the Module 1 screens.
import type { ReactNode } from 'react';

const TONES: Record<string, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONES[tone] ?? TONES['gray']}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof TONES {
  if (
    [
      'APPROVED', 'PUBLISHED_TO_CLIENT', 'STAGE_1_COMPLETE', 'PAID', 'SUBMITTED',
      'VISIT_COMPLETED', 'TECHNICALLY_APPROVED', 'RELEASED', 'RESOLVED', 'CLEARED',
      'EXECUTED', 'READY', 'CLIENT_ACCEPTED', 'VERIFIED', 'ISSUED', 'STAMPED', 'ACCEPTED',
      'MOBILIZED',
    ].includes(status)
  ) {
    return 'green';
  }
  if (
    [
      'IN_REVIEW', 'UNDER_REVIEW', 'VISIT_UNDERWAY', 'GENERATING', 'REPORT_GENERATING',
      'RESCHEDULED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'IN_RESOLUTION',
      'IN_DISCUSSION', 'UNDER_NEGOTIATION', 'PARTIALLY_PAID', 'APPLIED', 'PRINTED',
      'RETURNED_FOR_CLARIFICATION',
    ].includes(status)
  ) {
    return 'amber';
  }
  if (
    [
      'RETURNED', 'CORRECTIONS_REQUESTED', 'CANCELLED', 'FAILED',
      'RETURNED_WITH_COMMENTS', 'REJECTED', 'TERMINATED', 'EXPIRED',
      'BLOCKED', 'SUPERSEDED',
    ].includes(status)
  ) {
    return 'red';
  }
  if (
    [
      'PUBLISHED', 'REPORT_GENERATED', 'JUNIOR_ARCHITECT', 'RELEASED',
      'TWO_D', 'THREE_D', 'QUANTITY_SURVEYING', 'STRUCTURAL',
    ].includes(status)
  ) {
    return 'purple';
  }
  if (
    [
      'OPEN', 'DRAFT', 'BOOKED', 'ASSIGNED', 'PENDING',
      'NOT_STARTED', 'VISIT_AGREED', 'SENT',
    ].includes(status)
  ) {
    return 'blue';
  }
  return 'gray';
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow hover:shadow-md hover:shadow-slate-200/80 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function BeginnerGuide({
  role = 'general',
}: {
  role?: 'general' | 'staff' | 'field' | 'client';
}) {
  const guides: Record<NonNullable<typeof role>, Array<{ title: string; description: string }>> = {
    general: [
      {
        title: '1. Pick your role',
        description: 'Choose Staff, Field Officer, or Client to land in the right workspace for your work.',
      },
      {
        title: '2. Sign in securely',
        description: 'Use your email and password. Staff and field accounts use MFA for an extra verification step.',
      },
      {
        title: '3. Follow the workflow',
        description: 'Use the dashboard steps in sequence: queue → site visit → survey → review → publish or track progress.',
      },
    ],
    staff: [
      {
        title: '1. Review the inbox',
        description: 'Start with enquiries and conversations. Confirm the project, schedule the visit, and move it forward.',
      },
      {
        title: '2. Manage delivery stages',
        description: 'Check project status, review visit bookings, verify surveys, and approve reports before publication.',
      },
      {
        title: '3. Publish and track',
        description: 'Use the report and project actions to publish approved content to the client portal and document what changed.',
      },
    ],
    field: [
      {
        title: '1. Check assigned visits',
        description: 'Open your visit list and review the site details, date, contact, and location before leaving the office.',
      },
      {
        title: '2. Check in and survey',
        description: 'Use the visit page to check in, complete the visit workflow, and capture the required site survey information.',
      },
      {
        title: '3. Submit your findings',
        description: 'Once the survey is complete, submit it so staff can review the report and decide the next project stage.',
      },
    ],
    client: [
      {
        title: '1. View your projects',
        description: 'Your portal shows only published project information that the project team has explicitly shared with you.',
      },
      {
        title: '2. Open project details',
        description: 'Review project progress, visit schedules, and any report that has been published for your approval or viewing.',
      },
      {
        title: '3. Stay informed',
        description: 'Use the portal as your project progress view. The system keeps client information separate from internal staff workflows.',
      },
    ],
  };

  const steps = guides[role];

  return (
    <div className="mb-6 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-sky-50 to-white p-5 shadow-sm shadow-brand-100/60">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-700">Beginner guide</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">How to use MBMS</h3>
        </div>
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
          Simple 3-step flow
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-brand-100 bg-white/80 p-4 shadow-sm">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {index + 1}
            </div>
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-gray-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-700" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const buttonClass =
  'inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

export const dangerButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50';

export const linkClass = 'font-medium text-brand-700 hover:underline';

export function StatCard({
  label,
  value,
  hint,
  tone = 'gray',
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm shadow-slate-200/50 ${TONES[tone] ?? TONES['gray']}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{children}</h3>;
}


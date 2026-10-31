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
    <div className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
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
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
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
  'inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50';

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
    <div className={`rounded-xl border p-4 ${TONES[tone] ?? TONES['gray']}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{children}</h3>;
}


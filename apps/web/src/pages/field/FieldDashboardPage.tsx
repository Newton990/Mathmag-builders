// src/pages/field/FieldDashboardPage.tsx
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type { Booking, ListResponse } from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  buttonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

export function FieldDashboardPage() {
  const resource = useResource<ListResponse<Booking>>('/bookings?take=100');
  const bookings = resource.data?.items ?? [];

  const today = new Date();
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <div data-testid="field-dashboard" className="p-4">
      <PageHeader
        title="My visits"
        subtitle="Check in at the site before capturing the survey. Submission locks the original."
        actions={
          <button type="button" onClick={resource.reload} className={buttonClass}>
            Refresh
          </button>
        }
      />

      <ErrorBanner message={resource.error} />

      {resource.loading ? (
        <Loading label="Loading your visits…" />
      ) : sorted.length === 0 ? (
        <EmptyState title="No visits assigned" hint="Assigned visits will appear here." />
      ) : (
        <div className="space-y-3">
          {sorted.map((booking) => {
            const scheduled = new Date(booking.scheduledAt);
            const isToday =
              scheduled.getFullYear() === today.getFullYear() &&
              scheduled.getMonth() === today.getMonth() &&
              scheduled.getDate() === today.getDate();
            const canCheckIn =
              (booking.status === 'BOOKED' || booking.status === 'RESCHEDULED') && !booking.checkInAt;
            const canCheckOut = booking.status === 'VISIT_UNDERWAY' && booking.checkInAt && !booking.checkOutAt;
            const hasSurvey = (booking.surveys?.length ?? 0) > 0;

            return (
              <Card key={booking.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {booking.project.reference} · {booking.project.contact.fullName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDateTime(booking.scheduledAt)}
                      {isToday ? <span className="ml-2 text-xs text-amber-700">Today</span> : null}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.project.siteArea}, {booking.project.siteCounty}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Payment {humanize(booking.paymentStatus)}
                      {booking.visitFeeKes ? ` · ${booking.visitFeeKes} KES` : ''}
                    </p>
                  </div>
                  <Badge tone={statusTone(booking.status)}>{humanize(booking.status)}</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/field/visits/${booking.id}`} className={buttonClass}>
                    Visit details
                  </Link>
                  {canCheckIn ? (
                    <Link to={`/field/visits/${booking.id}`} className={buttonClass}>
                      Check in
                    </Link>
                  ) : null}
                  {canCheckOut ? (
                    <Link to={`/field/visits/${booking.id}`} className={buttonClass}>
                      Check out
                    </Link>
                  ) : null}
                  {booking.status === 'VISIT_COMPLETED' || booking.checkInAt ? (
                    <Link to={`/field/surveys/${booking.id}`} className={buttonClass}>
                      {hasSurvey ? 'Survey' : 'Start survey'}
                    </Link>
                  ) : null}
                </div>

                {booking.checkInAt ? (
                  <p className="mt-2 text-xs text-gray-500">Checked in {formatDateTime(booking.checkInAt)}</p>
                ) : null}
                {booking.checkOutAt ? (
                  <p className="text-xs text-gray-500">Checked out {formatDateTime(booking.checkOutAt)}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

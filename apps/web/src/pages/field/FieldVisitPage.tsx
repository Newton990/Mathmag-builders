// src/pages/field/FieldVisitPage.tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import type { Booking } from '../../lib/types';
import {
  Badge,
  Card,
  ErrorBanner,
  Loading,
  PageHeader,
  buttonClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';
import { formatGps, getCurrentGps } from '../../lib/gps';

export function FieldVisitPage() {
  const { id } = useParams();
  const resource = useResource<Booking>(id ? `/bookings/${id}` : null);
  const booking = resource.data;
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGps, setLastGps] = useState<string | null>(null);

  async function checkIn() {
    if (!id) return;
    setWorking(true);
    setError(null);
    try {
      const reading = await getCurrentGps();
      setLastGps(formatGps(reading));
      await api.post(`/bookings/${id}/check-in`, { gps: reading });
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function checkOut() {
    if (!id) return;
    setWorking(true);
    setError(null);
    try {
      const reading = await getCurrentGps();
      setLastGps(formatGps(reading));
      await api.post(`/bookings/${id}/check-out`, { gps: reading });
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  if (resource.loading) return <Loading label="Loading visit…" />;
  if (!booking) {
    return (
      <div className="p-4">
        <ErrorBanner message={resource.error ?? 'Visit not found'} />
        <Link to="/field" className={secondaryButtonClass}>
          Back to visits
        </Link>
      </div>
    );
  }

  const canCheckIn =
    (booking.status === 'BOOKED' || booking.status === 'RESCHEDULED') && !booking.checkInAt;
  const canCheckOut = booking.status === 'VISIT_UNDERWAY' && booking.checkInAt && !booking.checkOutAt;

  return (
    <div className="p-4">
      <PageHeader
        title={booking.project.reference}
        subtitle={`${booking.project.contact.fullName} · ${booking.project.siteArea}, ${booking.project.siteCounty}`}
        actions={<Badge tone={statusTone(booking.status)}>{humanize(booking.status)}</Badge>}
      />

      <ErrorBanner message={error ?? resource.error} />

      <div className="space-y-4">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Schedule</h3>
          <p className="text-sm text-gray-700">{formatDateTime(booking.scheduledAt)}</p>
          {booking.specialInstructions ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
              {booking.specialInstructions}
            </p>
          ) : null}
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Attendance</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Checked in</dt>
              <dd className="text-gray-900">{formatDateTime(booking.checkInAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Checked out</dt>
              <dd className="text-gray-900">{formatDateTime(booking.checkOutAt)}</dd>
            </div>
          </dl>
          {lastGps ? <p className="mt-2 text-xs text-gray-500">Last GPS: {lastGps}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {canCheckIn ? (
              <button type="button" disabled={working} className={buttonClass} onClick={checkIn}>
                {working ? 'Recording…' : 'Check in at site'}
              </button>
            ) : null}
            {canCheckOut ? (
              <button type="button" disabled={working} className={buttonClass} onClick={checkOut}>
                {working ? 'Recording…' : 'Check out of site'}
              </button>
            ) : null}
            {(booking.status === 'VISIT_UNDERWAY' || booking.status === 'VISIT_COMPLETED' || booking.checkInAt) ? (
              <Link to={`/field/surveys/${booking.id}`} className={buttonClass}>
                Survey (A–G)
              </Link>
            ) : null}
            <Link to="/field" className={secondaryButtonClass}>
              Back to visits
            </Link>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            GPS is captured on check-in and check-out. A stable network helps, but drafts can be saved
            offline.
          </p>
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Client</h3>
          <p className="text-sm text-gray-900">{booking.project.contact.fullName}</p>
          <p className="text-sm text-gray-600">{booking.project.contact.primaryPhone}</p>
          {booking.project.contact.email ? <p className="text-sm text-gray-600">{booking.project.contact.email}</p> : null}
        </Card>
      </div>
    </div>
  );
}

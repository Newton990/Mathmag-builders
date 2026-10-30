// src/lib/format.ts
// Display helpers. All timestamps are stored in UTC and shown in Africa/Nairobi.

const NAIROBI = 'Africa/Nairobi';

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: NAIROBI,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-KE', {
    timeZone: NAIROBI,
    dateStyle: 'medium',
  }).format(date);
}

/** Convert a local datetime-local value to an ISO instant. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

// Kenya has a fixed UTC+3 offset and no daylight saving, so the office's
// wall-clock time can be converted deterministically regardless of device TZ.
const NAIROBI_OFFSET = '+03:00';

/** Value for <input type="datetime-local"> in Africa/Nairobi time. */
export function isoToNairobiInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NAIROBI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const read = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}T${read('hour')}:${read('minute')}`;
}

/** Convert a Nairobi wall-clock input value to an ISO instant. */
export function nairobiInputToIso(value: string): string {
  return new Date(`${value}:00${NAIROBI_OFFSET}`).toISOString();
}

/** Value for <input type="date"> in Africa/Nairobi time. */
export function isoToNairobiDate(value: string | null | undefined): string {
  return isoToNairobiInput(value).slice(0, 10);
}

/** Convert a Nairobi calendar date to an ISO instant at 09:00 local time. */
export function nairobiDateToIso(value: string): string {
  return new Date(`${value}T09:00:00${NAIROBI_OFFSET}`).toISOString();
}

export function formatKes(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function humanize(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function shortId(value: string): string {
  return value.slice(0, 8);
}

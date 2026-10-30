// src/components/JsonView.tsx
// Read-only renderer for survey JSON captured in the field. Values are shown
// verbatim; nothing is interpreted as markdown or HTML.
import type { ReactNode } from 'react';
import type { JsonValue } from '../lib/types';

function labelize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function renderValue(value: JsonValue, depth: number): ReactNode {
  if (value === null) return <span className="text-gray-400">—</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">None</span>;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.map((entry, index) => (
          <li key={index}>{renderValue(entry, depth + 1)}</li>
        ))}
      </ul>
    );
  }
  if (depth > 4) return <span className="text-gray-400">…</span>;
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
      {Object.entries(value).map(([key, entry]) => (
        <div key={key} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-gray-400">{labelize(key)}</dt>
          <dd className="break-words text-sm text-gray-800">{renderValue(entry, depth + 1)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function JsonView({ value }: { value: JsonValue | null | undefined }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-gray-500">Not captured yet.</p>;
  }
  return <div className="text-sm text-gray-800">{renderValue(value, 0)}</div>;
}

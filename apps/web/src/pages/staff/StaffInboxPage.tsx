// src/pages/staff/StaffInboxPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type { ConversationSummary, ListResponse } from '../../lib/types';
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

const statuses = ['', 'OPEN', 'IN_DISCUSSION', 'VISIT_AGREED', 'LINKED_TO_PROJECT', 'CLOSED'];

export function StaffInboxPage() {
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const path = status ? `/conversations?status=${status}&take=100` : '/conversations?take=100';
  const resource = useResource<ListResponse<ConversationSummary>>(path);
  const items = resource.data?.items ?? [];

  const filtered = query.trim()
    ? items.filter((conversation) => {
        const haystack = `${conversation.contact.fullName} ${conversation.contact.primaryPhone} ${
          conversation.subject ?? ''
        }`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : items;

  return (
    <div>
      <PageHeader
        title="Enquiries inbox"
        subtitle="Leads and conversations. Projects only exist after confirming an agreed visit date."
        actions={
          <Link to="/staff/bookings/confirm" className={buttonClass}>
            Confirm site visit
          </Link>
        }
      />

      <ErrorBanner message={resource.error} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone or subject"
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value ? humanize(value) : 'All statuses'}
              </option>
            ))}
          </select>
          <button type="button" onClick={resource.reload} className="text-sm text-brand-700">
            Refresh
          </button>
        </div>
      </Card>

      {resource.loading ? (
        <Loading label="Loading inbox…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No conversations" hint="Create a conversation or wait for a new enquiry." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Subject / Channel</th>
                  <th className="px-5 py-3">Assigned</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last activity</th>
                  <th className="px-5 py-3">Messages</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conversation) => (
                  <tr key={conversation.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        to={`/staff/inbox/${conversation.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {conversation.contact.fullName}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {conversation.contact.primaryPhone}
                        {conversation.contact.email ? ` · ${conversation.contact.email}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900">{conversation.subject ?? '—'}</p>
                      <p className="text-xs text-gray-500">{humanize(conversation.channel)}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {conversation.assignedStaff?.name ?? <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(conversation.status)}>
                        {humanize(conversation.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {formatDateTime(conversation.lastActivityAt)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{conversation._count.messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

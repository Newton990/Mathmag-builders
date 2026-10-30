// src/pages/staff/StaffProjectsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type { ListResponse, ProjectSummary } from '../../lib/types';
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

const stages = [
  '',
  'VISIT_BOOKED',
  'VISIT_UNDERWAY',
  'VISIT_COMPLETED',
  'REPORT_GENERATING',
  'REPORT_GENERATED',
  'UNDER_REVIEW',
  'CORRECTIONS_REQUESTED',
  'APPROVED',
  'PUBLISHED_TO_CLIENT',
  'STAGE_1_COMPLETE',
];

export function StaffProjectsPage() {
  const [stage, setStage] = useState('');
  const [query, setQuery] = useState('');
  const path = stage ? `/projects?stage=${stage}&take=100` : '/projects?take=100';
  const resource = useResource<ListResponse<ProjectSummary>>(path);
  const items = resource.data?.items ?? [];

  const filtered = query.trim()
    ? items.filter((project) => {
        const haystack = `${project.reference} ${project.contact.fullName} ${project.siteArea} ${project.siteCounty}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : items;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every project came from an agreed visit booking. Surveys are held against the booking."
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
            placeholder="Search reference, client, area or county"
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {stages.map((value) => (
              <option key={value} value={value}>
                {value ? humanize(value) : 'All stages'}
              </option>
            ))}
          </select>
          <button type="button" onClick={resource.reload} className="text-sm text-brand-700">
            Refresh
          </button>
        </div>
      </Card>

      {resource.loading ? (
        <Loading label="Loading projects…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects" hint="Confirm an agreed site visit to create a project." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Site</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Visit</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/staff/projects/${project.id}`} className="font-medium text-gray-900 hover:underline">
                        {project.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-900">{project.contact.fullName}</p>
                      <p className="text-xs text-gray-500">{project.contact.primaryPhone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {project.siteArea}, {project.siteCounty}
                      {project.projectType ? <p className="text-xs text-gray-500">{project.projectType}</p> : null}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(project.currentStage)}>{humanize(project.currentStage)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {project.visitBooking ? formatDateTime(project.visitBooking.scheduledAt) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatDateTime(project.updatedAt)}</td>
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

// src/pages/staff/StaffReportsPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type { ListResponse, ReportSummary } from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

const states = ['', 'DRAFT', 'IN_REVIEW', 'APPROVED', 'RETURNED'];

export function StaffReportsPage() {
  const [approvalState, setApprovalState] = useState('');
  const path = approvalState ? `/reports?approvalState=${approvalState}&take=100` : '/reports?take=100';
  const resource = useResource<ListResponse<ReportSummary>>(path);
  const items = resource.data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Review, approval and assignment are separate actions. Publishing requires explicit publication."
        actions={null}
      />

      <ErrorBanner message={resource.error} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={approvalState}
            onChange={(event) => setApprovalState(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {states.map((value) => (
              <option key={value} value={value}>
                {value ? humanize(value) : 'All approval states'}
              </option>
            ))}
          </select>
          <button type="button" onClick={resource.reload} className="text-sm text-brand-700">
            Refresh
          </button>
        </div>
      </Card>

      {resource.loading ? (
        <Loading label="Loading reports…" />
      ) : items.length === 0 ? (
        <EmptyState title="No reports" hint="Generate a report from a submitted survey." />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Report</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Generator</th>
                  <th className="px-5 py-3">Approval</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/staff/reports/${report.id}`} className="font-medium text-gray-900 hover:underline">
                        v{report.versionNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {report.survey?.booking.project.reference ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {report.survey?.booking.project.contact.fullName ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(report.generatorStatus)}>{humanize(report.generatorStatus)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(report.approvalState)}>{humanize(report.approvalState)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatDateTime(report.createdAt)}</td>
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

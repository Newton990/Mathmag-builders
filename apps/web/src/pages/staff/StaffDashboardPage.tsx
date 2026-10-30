// src/pages/staff/StaffDashboardPage.tsx
// Operational overview. Counts are derived from the same scoped list endpoints
// the detail screens use, so a role never sees a number it cannot drill into.
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type {
  ConversationSummary,
  ListResponse,
  ProjectSummary,
  ReportSummary,
} from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  SectionTitle,
  StatCard,
  linkClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

export function StaffDashboardPage() {
  const conversations = useResource<ListResponse<ConversationSummary>>(
    '/conversations?take=100',
  );
  const projects = useResource<ListResponse<ProjectSummary>>('/projects?take=100');
  const reports = useResource<ListResponse<ReportSummary>>('/reports?take=100');

  const loading = conversations.loading || projects.loading || reports.loading;
  const error = conversations.error ?? projects.error ?? reports.error;

  const openEnquiries =
    conversations.data?.items.filter(
      (item) => item.status !== 'CLOSED' && item.status !== 'LINKED_TO_PROJECT',
    ) ?? [];
  const upcomingVisits =
    projects.data?.items
      .filter((project) => {
        const booking = project.visitBooking;
        return (
          booking !== null &&
          booking !== undefined &&
          (booking.status === 'BOOKED' || booking.status === 'RESCHEDULED') &&
          new Date(booking.scheduledAt).getTime() >= Date.now() - 3_600_000
        );
      })
      .slice(0, 6) ?? [];
  const awaitingReview =
    reports.data?.items.filter((report) => report.approvalState === 'IN_REVIEW') ?? [];
  const readyToPublish =
    reports.data?.items.filter(
      (report) =>
        report.approvalState === 'APPROVED' && report.generatorStatus === 'GENERATED',
    ) ?? [];

  return (
    <div data-testid="staff-dashboard">
      <PageHeader
        title="Operations dashboard"
        subtitle="Module 1 — enquiries, agreed visits, field surveys and report governance."
        actions={
          <>
            <Link to="/staff/inbox" className={linkClass}>
              Open inbox
            </Link>
            <Link to="/staff/projects" className={linkClass}>
              All projects
            </Link>
          </>
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <Loading label="Loading operational overview…" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Open enquiries"
              value={openEnquiries.length}
              hint="Conversations not yet booked or closed"
              tone="blue"
            />
            <StatCard
              label="Upcoming visits"
              value={upcomingVisits.length}
              hint="Agreed dates, not yet visited"
              tone="amber"
            />
            <StatCard
              label="Reports in review"
              value={awaitingReview.length}
              hint="Waiting for the Lead Architect"
              tone="purple"
            />
            <StatCard
              label="Ready to publish"
              value={readyToPublish.length}
              hint="Approved and generated"
              tone="green"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionTitle>Enquiries needing action</SectionTitle>
              {openEnquiries.length === 0 ? (
                <EmptyState
                  title="No open enquiries"
                  hint="New enquiries will appear here as they arrive."
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {openEnquiries.slice(0, 6).map((conversation) => (
                    <li key={conversation.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <Link
                          to={`/staff/inbox/${conversation.id}`}
                          className="truncate text-sm font-medium text-gray-900 hover:underline"
                        >
                          {conversation.contact.fullName}
                        </Link>
                        <p className="truncate text-xs text-gray-500">
                          {conversation.subject ?? humanize(conversation.channel)} ·{' '}
                          {formatDateTime(conversation.lastActivityAt)}
                        </p>
                      </div>
                      <Badge tone={statusTone(conversation.status)}>
                        {humanize(conversation.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <SectionTitle>Agreed site visits</SectionTitle>
              {upcomingVisits.length === 0 ? (
                <EmptyState
                  title="No upcoming visits"
                  hint="Confirm an agreed date from an enquiry to create the project."
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {upcomingVisits.map((project) => {
                    const booking = project.visitBooking;
                    if (!booking) return null;
                    return (
                      <li key={project.id} className="flex items-start justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <Link
                            to={`/staff/projects/${project.id}`}
                            className="truncate text-sm font-medium text-gray-900 hover:underline"
                          >
                            {project.reference} · {project.contact.fullName}
                          </Link>
                          <p className="truncate text-xs text-gray-500">
                            {formatDateTime(booking.scheduledAt)} · {project.siteArea},{' '}
                            {project.siteCounty}
                          </p>
                        </div>
                        <Badge tone={statusTone(booking.status)}>
                          {humanize(booking.status)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <SectionTitle>Reports in review</SectionTitle>
              {awaitingReview.length === 0 ? (
                <EmptyState title="Nothing awaiting review" />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {awaitingReview.slice(0, 6).map((report) => (
                    <li key={report.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <Link
                          to={`/staff/reports/${report.id}`}
                          className="truncate text-sm font-medium text-gray-900 hover:underline"
                        >
                          {report.survey?.booking.project.reference ?? 'Report'} · v
                          {report.versionNumber}
                        </Link>
                        <p className="truncate text-xs text-gray-500">
                          {report.survey?.booking.project.contact.fullName ?? ''}
                        </p>
                      </div>
                      <Badge tone={statusTone(report.approvalState)}>
                        {humanize(report.approvalState)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <SectionTitle>Approved reports</SectionTitle>
              {readyToPublish.length === 0 ? (
                <EmptyState
                  title="No approved reports"
                  hint="Approval does not publish anything — publication is a separate action."
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {readyToPublish.slice(0, 6).map((report) => (
                    <li key={report.id} className="flex items-start justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <Link
                          to={`/staff/reports/${report.id}`}
                          className="truncate text-sm font-medium text-gray-900 hover:underline"
                        >
                          {report.survey?.booking.project.reference ?? 'Report'} · v
                          {report.versionNumber}
                        </Link>
                        <p className="truncate text-xs text-gray-500">
                          Generated {formatDateTime(report.generatedAt)}
                        </p>
                      </div>
                      <Badge tone="green">Approved</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/staff/StaffProjectPage.tsx
import { Link, useParams } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type {
  ItemsResponse,
  JuniorAssignment,
  ListResponse,
  ProjectDetail,
  ReportSummary,
  SiteSurvey,
} from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  SectionTitle,
  buttonClass,
  linkClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

interface SurveysResponse {
  items: SiteSurvey[];
}

export function StaffProjectPage() {
  const { id } = useParams();
  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const surveys = useResource<SurveysResponse>(id ? `/projects/${id}/surveys` : null);
  const reports = useResource<ListResponse<ReportSummary>>(
    id ? `/reports?projectId=${id}&take=100` : null,
  );
  const assignments = useResource<ItemsResponse<JuniorAssignment>>(
    id ? `/projects/${id}/assignments` : null,
  );

  const data = project.data;
  const loading = project.loading || surveys.loading || reports.loading || assignments.loading;
  const error = project.error ?? surveys.error ?? reports.error ?? assignments.error;

  if (loading) return <Loading label="Loading project…" />;

  if (!data) {
    return (
      <div>
        <ErrorBanner message={error ?? 'Project not found'} />
        <Link to="/staff/projects" className={linkClass}>
          Back to projects
        </Link>
      </div>
    );
  }

  const booking = data.visitBooking;

  return (
    <div>
      <PageHeader
        title={data.reference}
        subtitle={`${data.siteArea}, ${data.siteCounty}${data.projectType ? ` · ${data.projectType}` : ''}`}
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to="/staff/projects" className={secondaryButtonClass}>
              Back to projects
            </Link>
            <Link to={`/staff/projects/${id}/planning`} className={secondaryButtonClass}>
              Planning →
            </Link>
            <Link to={`/staff/projects/${id}/acceptance`} className={secondaryButtonClass}>
              Acceptance →
            </Link>
            <Link to={`/staff/projects/${id}/approvals`} className={secondaryButtonClass}>
              Approvals →
            </Link>
            <Link to={`/staff/projects/${id}/contracts`} className={secondaryButtonClass}>
              Contracts →
            </Link>
            <Link to={`/staff/projects/${id}/construction`} className={secondaryButtonClass}>
              Construction →
            </Link>
            <Link to="/staff/reports" className={buttonClass}>
              Reports
            </Link>
          </>
        }
      />

      <ErrorBanner message={error} />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionTitle>Site & client</SectionTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Client</dt>
                <dd className="text-sm text-gray-900">{data.contact.fullName}</dd>
                <dd className="text-sm text-gray-600">{data.contact.primaryPhone}</dd>
                {data.contact.email ? <dd className="text-sm text-gray-600">{data.contact.email}</dd> : null}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Site</dt>
                <dd className="text-sm text-gray-900">
                  {data.siteArea}, {data.siteCounty}
                  {data.siteSubCounty ? `, ${data.siteSubCounty}` : ''}
                </dd>
                {data.siteDirections ? <dd className="text-sm text-gray-600">{data.siteDirections}</dd> : null}
              </div>
            </dl>
          </Card>

          <Card>
            <SectionTitle>Visit booking</SectionTitle>
            {booking ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Scheduled</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(booking.scheduledAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Status</dt>
                  <dd>
                    <Badge tone={statusTone(booking.status)}>{humanize(booking.status)}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Assigned officer</dt>
                  <dd className="text-sm text-gray-900">{booking.assignedOfficer?.name ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Payment</dt>
                  <dd>
                    <Badge tone={statusTone(booking.paymentStatus)}>{humanize(booking.paymentStatus)}</Badge>
                    {booking.visitFeeKes ? <span className="ml-2 text-sm text-gray-600">{booking.visitFeeKes} KES</span> : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Check-in</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(booking.checkInAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400">Check-out</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(booking.checkOutAt)}</dd>
                </div>
              </dl>
            ) : (
              <EmptyState title="No booking found" />
            )}
          </Card>

          <Card>
            <SectionTitle>Site surveys</SectionTitle>
            {(surveys.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                title="No survey yet"
                hint="The visiting officer creates a draft after checking in. Submission locks the original."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {surveys.data?.items.map((survey) => (
                  <li key={survey.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <Link to={`/field/surveys/${survey.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        Survey v{survey.version}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {survey.capturedBy?.name ? `By ${survey.capturedBy.name}` : ''}{' '}
                        {survey.submittedAt ? `· Submitted ${formatDateTime(survey.submittedAt)}` : '· Draft'}
                      </p>
                    </div>
                    <Badge tone={statusTone(survey.status)}>{humanize(survey.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Reports & assignments</SectionTitle>
            {(reports.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                title="No report generated"
                hint="Generate from a submitted survey. Approval and publication are separate."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {reports.data?.items.map((report) => (
                  <li key={report.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <Link to={`/staff/reports/${report.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        Report v{report.versionNumber}
                      </Link>
                      <p className="text-xs text-gray-500">
                        Generator {humanize(report.generatorStatus)} · {report._count?.reviews ?? 0} reviews
                      </p>
                    </div>
                    <Badge tone={statusTone(report.approvalState)}>{humanize(report.approvalState)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {(assignments.data?.items.length ?? 0) > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Junior assignments
                </p>
                <ul className="space-y-1">
                  {assignments.data?.items.map((assignment) => (
                    <li key={assignment.id} className="text-sm text-gray-700">
                      {assignment.juniorArchitect.name} — {humanize(assignment.priority)}
                      {assignment.dueDate ? ` · due ${formatDateTime(assignment.dueDate)}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        </div>

        <Card>
          <SectionTitle>Access</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Staff visible</dt>
              <dd className="text-gray-900">{data.access.isStaff ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Company-wide</dt>
              <dd className="text-gray-900">{data.access.isCompanyWide ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Assigned officer</dt>
              <dd className="text-gray-900">{data.access.isAssignedOfficer ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Junior architect</dt>
              <dd className="text-gray-900">{data.access.isJuniorArchitect ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Client owner</dt>
              <dd className="text-gray-900">{data.access.isClientOwner ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

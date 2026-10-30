// src/pages/portal/ClientProjectPage.tsx
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import type { PortalProjectDetail } from '../../lib/types';
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

export function ClientProjectPage() {
  const { id } = useParams();
  const resource = useResource<PortalProjectDetail>(id ? `/portal/projects/${id}` : null);
  const project = resource.data;
  const publication = project?.publication;

  if (resource.loading) return <Loading label="Loading project…" />;
  if (!project) {
    return (
      <div>
        <ErrorBanner message={resource.error ?? 'Project not found'} />
        <Link to="/portal" className={linkClass}>
          Back to projects
        </Link>
      </div>
    );
  }

  async function downloadReport() {
    if (!publication) return;
    const response = await api.get<{ url: string }>(`/portal/reports/${publication.reportVersion.id}/download`);
    window.open(response.url, '_blank', 'noopener,noreferrer');
  }

  async function downloadMedia(mediaId: string) {
    const response = await api.get<{ url: string }>(`/portal/media/${mediaId}/download`);
    window.open(response.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div>
      <PageHeader
        title={project.reference}
        subtitle={`${project.siteArea}, ${project.siteCounty}${project.projectType ? ` · ${project.projectType}` : ''}`}
        actions={
          <>
            <Badge tone={statusTone(project.currentStage)}>{humanize(project.currentStage)}</Badge>
            <Link to="/portal" className={secondaryButtonClass}>
              Back to projects
            </Link>
          </>
        }
      />

      <ErrorBanner message={resource.error} />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionTitle>Project details</SectionTitle>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Client</dt>
                <dd className="text-sm text-gray-900">{project.contact.fullName}</dd>
                <dd className="text-sm text-gray-600">{project.contact.primaryPhone}</dd>
                {project.contact.email ? <dd className="text-sm text-gray-600">{project.contact.email}</dd> : null}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Site</dt>
                <dd className="text-sm text-gray-900">
                  {project.siteArea}, {project.siteCounty}
                  {project.siteSubCounty ? `, ${project.siteSubCounty}` : ''}
                </dd>
                {project.siteDirections ? <dd className="text-sm text-gray-600">{project.siteDirections}</dd> : null}
              </div>
            </dl>
          </Card>

          <Card>
            <SectionTitle>Published report</SectionTitle>
            {publication ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Report v{publication.reportVersion.versionNumber}</p>
                    <p className="text-xs text-gray-500">
                      Published {formatDateTime(publication.publishedAt)}
                      {publication.reportVersion.approvedAt ? ` · Approved ${formatDateTime(publication.reportVersion.approvedAt)}` : ''}
                    </p>
                  </div>
                  <Badge tone="green">Published</Badge>
                </div>
                <button type="button" className={buttonClass} onClick={downloadReport}>
                  Download PDF
                </button>
                <p className="text-xs text-gray-500">DOCX is not available to clients.</p>
              </div>
            ) : (
              <EmptyState title="Not published yet" hint="The Lead Architect has not published this report to the portal." />
            )}
          </Card>

          <Card>
            <SectionTitle>Published media</SectionTitle>
            {publication && publication.permittedMedia.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {publication.permittedMedia.map((media) => (
                  <li key={media.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="text-sm text-gray-900">
                        {media.category} · {humanize(media.kind)}
                      </p>
                      {media.caption ? <p className="text-xs text-gray-500">{media.caption}</p> : null}
                    </div>
                    <button type="button" className={secondaryButtonClass} onClick={() => downloadMedia(media.id)}>
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No media published" hint="Only media explicitly permitted at publication is shown here." />
            )}
          </Card>
        </div>

        <Card>
          <SectionTitle>Visit</SectionTitle>
          {project.visitBooking ? (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Scheduled</dt>
                <dd className="text-gray-900">{formatDateTime(project.visitBooking.scheduledAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge tone={statusTone(project.visitBooking.status)}>{humanize(project.visitBooking.status)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Payment</dt>
                <dd>
                  <Badge tone={statusTone(project.visitBooking.paymentStatus)}>{humanize(project.visitBooking.paymentStatus)}</Badge>
                  {project.visitBooking.visitFeeKes ? (
                    <span className="ml-2 text-gray-600">{project.visitBooking.visitFeeKes} KES</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Visiting officer</dt>
                <dd className="text-gray-900">{project.visitBooking.assignedOfficer?.name ?? 'To be assigned'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No visit booked.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

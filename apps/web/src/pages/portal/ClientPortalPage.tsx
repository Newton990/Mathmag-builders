// src/pages/portal/ClientPortalPage.tsx
import { Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import type { ListResponse, PortalProject } from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  linkClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

export function ClientPortalPage() {
  const resource = useResource<ListResponse<PortalProject>>('/portal/projects');
  const items = resource.data?.items ?? [];

  return (
    <div data-testid="client-portal">
      <PageHeader
        title="My projects"
        subtitle="Only content the Lead Architect has explicitly published is visible here."
      />

      <ErrorBanner message={resource.error} />

      {resource.loading ? (
        <Loading label="Loading your projects…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="Once your site visit is confirmed and a report is published, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((project) => (
            <Card key={project.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {project.reference} · {project.siteArea}, {project.siteCounty}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {project.projectType ?? 'Project'}
                    {project.visitBooking
                      ? ` · Visit ${formatDateTime(project.visitBooking.scheduledAt)}`
                      : ''}
                  </p>
                </div>
                <Badge tone={statusTone(project.currentStage)}>{humanize(project.currentStage)}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {project.hasPublishedReport ? (
                    <span className="text-green-700">Report published</span>
                  ) : (
                    'Report not yet published'
                  )}
                </p>
                <Link to={`/portal/projects/${project.id}`} className={linkClass}>
                  View project
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

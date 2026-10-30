// src/pages/staff/StaffReportPage.tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import type { DirectoryUser, ItemsResponse, ReportDetail } from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  Loading,
  PageHeader,
  SectionTitle,
  buttonClass,
  dangerButtonClass,
  inputClass,
  linkClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

export function StaffReportPage() {
  const { id } = useParams();
  const resource = useResource<ReportDetail>(id ? `/reports/${id}` : null);
  const report = resource.data;
  const juniors = useResource<ItemsResponse<DirectoryUser>>('/directory/users?role=JUNIOR_ARCHITECT');

  const [comments, setComments] = useState('');
  const [juniorArchitectId, setJuniorArchitectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [instructions, setInstructions] = useState('');
  const [permittedMediaIds, setPermittedMediaIds] = useState<string[]>([]);
  const [revokeReason, setRevokeReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setActionError(null);
    try {
      await action();
      resource.reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (resource.loading) return <Loading label="Loading report…" />;
  if (!report) {
    return (
      <div>
        <ErrorBanner message={resource.error ?? 'Report not found'} />
        <Link to="/staff/reports" className={linkClass}>
          Back to reports
        </Link>
      </div>
    );
  }

  const projectId = report.survey.booking.project.id;
  const projectRef = report.survey.booking.project.reference;
  const activePublication = report.publications.find((publication) => publication.revokedAt === null);

  async function submitReview(decision: 'APPROVED' | 'RETURNED') {
    if (!report) return;
    if (decision === 'RETURNED' && !comments.trim()) {
      setActionError('Return comments are required');
      return;
    }
    await run(() =>
      api.post(`/reports/${report.id}/lead-review`, {
        decision,
        comments: comments.trim() || undefined,
      }),
    );
    setComments('');
  }

  async function assign() {
    if (!report) return;
    if (!juniorArchitectId) {
      setActionError('Select a junior architect');
      return;
    }
    await run(() =>
      api.post(`/projects/${projectId}/architectural-assignments`, {
        reportVersionId: report.id,
        juniorArchitectId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        instructions: instructions.trim() || undefined,
      }),
    );
    setInstructions('');
  }

  async function publish() {
    if (!report) return;
    await run(() =>
      api.post(`/publications`, {
        reportVersionId: report.id,
        permittedMediaIds,
      }),
    );
  }

  async function revoke() {
    if (!activePublication) return;
    if (!revokeReason.trim()) {
      setActionError('A revocation reason is required');
      return;
    }
    await run(() =>
      api.post(`/publications/${activePublication.id}/revoke`, {
        reason: revokeReason.trim(),
      }),
    );
    setRevokeReason('');
  }

  function toggleMedia(mediaId: string) {
    setPermittedMediaIds((current) =>
      current.includes(mediaId)
        ? current.filter((value) => value !== mediaId)
        : [...current, mediaId],
    );
  }

  return (
    <div>
      <PageHeader
        title={`${projectRef} — Report v${report.versionNumber}`}
        subtitle="Approval and publication are separate. Only explicitly published content appears in the client portal."
        actions={
          <>
            <Badge tone={statusTone(report.approvalState)}>{humanize(report.approvalState)}</Badge>
            <Badge tone={statusTone(report.generatorStatus)}>{humanize(report.generatorStatus)}</Badge>
            <Link to={`/staff/projects/${projectId}`} className={secondaryButtonClass}>
              Project
            </Link>
            <Link to="/staff/reports" className={secondaryButtonClass}>
              All reports
            </Link>
          </>
        }
      />

      <ErrorBanner message={actionError ?? resource.error} />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <SectionTitle>Report files</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {report.pdfKey ? (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    run(async () => {
                      const response = await api.get<{ url: string }>(`/reports/${report.id}/download?format=pdf`);
                      window.open(response.url, '_blank', 'noopener,noreferrer');
                    })
                  }
                >
                  Download PDF
                </button>
              ) : (
                <span className="text-sm text-gray-500">PDF not ready</span>
              )}
              {report.docxKey ? (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() =>
                    run(async () => {
                      const response = await api.get<{ url: string }>(`/reports/${report.id}/download?format=docx`);
                      window.open(response.url, '_blank', 'noopener,noreferrer');
                    })
                  }
                >
                  Download DOCX (staff only)
                </button>
              ) : (
                <span className="text-sm text-gray-500">DOCX not ready</span>
              )}
            </div>
            {report.generatorError ? (
              <p className="mt-2 text-sm text-red-600">{report.generatorError}</p>
            ) : null}
          </Card>

          <Card>
            <SectionTitle>Review history</SectionTitle>
            {report.reviews.length === 0 ? (
              <EmptyState title="No reviews yet" hint="Send for review from DRAFT or RETURNED." />
            ) : (
              <ul className="space-y-2">
                {report.reviews.map((review) => (
                  <li key={review.id} className="rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {review.reviewer?.name ?? 'Reviewer'} — {humanize(review.decision)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(review.createdAt)}</p>
                    </div>
                    {review.comments ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{review.comments}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle>Publications</SectionTitle>
            {report.publications.length === 0 ? (
              <EmptyState title="Never published" />
            ) : (
              <ul className="space-y-2">
                {report.publications.map((publication) => (
                  <li key={publication.id} className="rounded-lg border border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Published {formatDateTime(publication.publishedAt)}
                      </p>
                      {publication.revokedAt ? (
                        <Badge tone="red">Revoked</Badge>
                      ) : (
                        <Badge tone="green">Active</Badge>
                      )}
                    </div>
                    {publication.revokedAt ? (
                      <p className="mt-1 text-sm text-gray-600">
                        Revoked {formatDateTime(publication.revokedAt)} — {publication.revokeReason}
                      </p>
                    ) : null}
                    {publication.permittedMedia && publication.permittedMedia.length > 0 ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Permitted media: {publication.permittedMedia.length}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionTitle>Lead Architect actions</SectionTitle>
            {(report.approvalState === 'DRAFT' || report.approvalState === 'RETURNED') &&
            report.generatorStatus === 'GENERATED' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={saving}
                  className={buttonClass}
                  onClick={() => run(() => api.post(`/reports/${report.id}/submit-review`))}
                >
                  Send for review
                </button>
              </div>
            ) : null}

            {report.approvalState === 'IN_REVIEW' ? (
              <div className="space-y-3">
                <Field label="Comments (required to return)">
                  <textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    rows={4}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={saving} className={buttonClass} onClick={() => submitReview('APPROVED')}>
                    Approve
                  </button>
                  <button type="button" disabled={saving} className={dangerButtonClass} onClick={() => submitReview('RETURNED')}>
                    Return for corrections
                  </button>
                </div>
              </div>
            ) : null}

            {report.approvalState === 'APPROVED' && report.generatorStatus === 'GENERATED' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Approval does not publish the report. Assign a junior architect if needed, then publish
                  explicitly and choose which media to expose.
                </p>
                <Field label="Assign junior architect">
                  <select
                    value={juniorArchitectId}
                    onChange={(event) => setJuniorArchitectId(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {juniors.data?.items.map((junior) => (
                      <option key={junior.id} value={junior.id}>
                        {junior.name} ({junior.email})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Due date (optional)">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Priority">
                  <select value={priority} onChange={(event) => setPriority(event.target.value)} className={inputClass}>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </Field>
                <Field label="Instructions (optional)">
                  <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <button type="button" disabled={saving} className={secondaryButtonClass} onClick={assign}>
                  Assign junior architect
                </button>
              </div>
            ) : null}
          </Card>

          {report.approvalState === 'APPROVED' && report.generatorStatus === 'GENERATED' ? (
            <Card>
              <SectionTitle>Publish to client portal</SectionTitle>
              {activePublication ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    A publication is already active. Publishing again will supersede the current one.
                  </p>
                  <Field label="Revocation reason (to withdraw the active publication)">
                    <input
                      value={revokeReason}
                      onChange={(event) => setRevokeReason(event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <button type="button" disabled={saving} className={dangerButtonClass} onClick={revoke}>
                    Revoke active publication
                  </button>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-900">Permitted media</p>
                {report.survey.media.length === 0 ? (
                  <p className="text-sm text-gray-500">No media captured for this survey.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.survey.media.map((media) => (
                      <li key={media.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={permittedMediaIds.includes(media.id)}
                          onChange={() => toggleMedia(media.id)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm text-gray-900">
                            {media.category} · {humanize(media.kind)}
                          </p>
                          {media.caption ? <p className="text-xs text-gray-500">{media.caption}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" disabled={saving} className={buttonClass} onClick={publish}>
                  {activePublication ? 'Publish new version (supersede)' : 'Publish to client portal'}
                </button>
                <p className="text-xs text-gray-500">
                  DOCX is never exposed to clients. The portal only shows explicitly published content.
                </p>
              </div>
            </Card>
          ) : null}

          <Card>
            <SectionTitle>Project</SectionTitle>
            <p className="text-sm text-gray-900">{projectRef}</p>
            <Link to={`/staff/projects/${projectId}`} className={linkClass}>
              View project details
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

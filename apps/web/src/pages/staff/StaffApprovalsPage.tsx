// src/pages/staff/StaffApprovalsPage.tsx
// Module 4 — Statutory Approvals for a project.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type { ProjectDetail, ApprovalCase } from '../../lib/types';
import {
  Badge,
  Card,
  EmptyState,
  ErrorBanner,
  Loading,
  PageHeader,
  SectionTitle,
  StatCard,
  buttonClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

type CaseTab = 'permits' | 'prints';

export function StaffApprovalsPage() {
  const { id } = useParams();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseTab, setCaseTab] = useState<CaseTab>('permits');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const cases = useResource<{ data: ApprovalCase[] }>(
    id ? `/approvals/projects/${id}/cases` : null,
  );
  const selectedCase = useResource<{ data: ApprovalCase }>(
    selectedCaseId ? `/approvals/cases/${selectedCaseId}` : null,
  );

  const loading = project.loading || cases.loading;
  const error = project.error ?? cases.error ?? selectedCase.error;

  if (loading) return <Loading label="Loading approvals…" />;
  if (!project.data) {
    return (
      <div>
        <ErrorBanner message={error ?? 'Project not found'} />
        <Link to="/staff/projects" className={secondaryButtonClass}>
          Back to projects
        </Link>
      </div>
    );
  }

  const data = project.data;
  const caseList = cases.data?.data ?? [];
  const activeCase = selectedCase.data?.data ?? null;

  const openCases = caseList.filter((c) => c.status !== 'CLEARED' && c.status !== 'REJECTED');
  const clearedCases = caseList.filter((c) => c.status === 'CLEARED');

  async function handleCreateCase() {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/approvals/projects/${id}/cases`, { priority: 'NORMAL' });
      await cases.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPermit(caseId: string) {
    const permitType = window.prompt('Permit type (e.g. Building Permit, NCA):');
    if (!permitType) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/approvals/cases/${caseId}/permits`, { permitType });
      await selectedCase.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdatePermit(permitId: string, status: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.patch(`/approvals/permits/${permitId}`, { status });
      await selectedCase.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddPrint(caseId: string) {
    const documentName = window.prompt('Document name:');
    if (!documentName) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/approvals/cases/${caseId}/prints`, { documentName });
      await selectedCase.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCaseStatus(caseId: string, status: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.patch(`/approvals/cases/${caseId}/status`, { status });
      await cases.reload?.();
      await selectedCase.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`${data.reference} — Approvals`}
        subtitle="Module 4: Statutory approvals & permits"
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to={`/staff/projects/${id}/acceptance`} className={secondaryButtonClass}>
              ← Acceptance
            </Link>
            <Link to={`/staff/projects/${id}/contracts`} className={secondaryButtonClass}>
              Contracts →
            </Link>
          </>
        }
      />

      <ErrorBanner message={error ?? submitError} />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Cases" value={String(caseList.length)} />
        <StatCard label="Open" value={String(openCases.length)} />
        <StatCard label="Cleared" value={String(clearedCases.length)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        {/* Case list */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Approval Cases</SectionTitle>
            <button className={buttonClass} onClick={handleCreateCase} disabled={submitting}>
              {submitting ? 'Working…' : 'New Case'}
            </button>
          </div>
          {caseList.length === 0 ? (
            <EmptyState
              title="No cases yet"
              hint="Create an approval case to start tracking statutory permits and prints."
            />
          ) : (
            <ul className="space-y-2">
              {caseList.map((c) => (
                <li key={c.id}>
                  <button
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedCaseId === c.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setCaseTab('permits');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        Case #{c.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge tone={statusTone(c.status)}>{humanize(c.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {humanize(c.priority ?? 'NORMAL')} priority · Created{' '}
                      {formatDateTime(c.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c._count?.permits ?? 0} permits · {c._count?.prints ?? 0} prints
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Case detail */}
        {selectedCaseId ? (
          <div className="space-y-4">
            {selectedCase.loading ? (
              <Loading label="Loading case…" />
            ) : activeCase ? (
              <>
                {/* Case header */}
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Case #{activeCase.id.slice(-6).toUpperCase()}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {humanize(activeCase.priority ?? 'NORMAL')} priority · Created{' '}
                        {formatDateTime(activeCase.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={statusTone(activeCase.status)}>
                        {humanize(activeCase.status)}
                      </Badge>
                    </div>
                  </div>
                  {/* Status actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeCase.status === 'OPEN' && (
                      <button
                        className={secondaryButtonClass}
                        onClick={() => handleUpdateCaseStatus(activeCase.id, 'IN_PROGRESS')}
                        disabled={submitting}
                      >
                        Mark In Progress
                      </button>
                    )}
                    {activeCase.status === 'IN_PROGRESS' && (
                      <button
                        className={secondaryButtonClass}
                        onClick={() => handleUpdateCaseStatus(activeCase.id, 'SUBMITTED')}
                        disabled={submitting}
                      >
                        Mark Submitted
                      </button>
                    )}
                    {activeCase.status === 'SUBMITTED' && (
                      <>
                        <button
                          className={buttonClass}
                          onClick={() => handleUpdateCaseStatus(activeCase.id, 'CLEARED')}
                          disabled={submitting}
                        >
                          Mark Cleared
                        </button>
                        <button
                          className={secondaryButtonClass}
                          onClick={() => handleUpdateCaseStatus(activeCase.id, 'RETURNED')}
                          disabled={submitting}
                        >
                          Mark Returned
                        </button>
                      </>
                    )}
                  </div>
                </Card>

                {/* Permits / Prints tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  {(['permits', 'prints'] as CaseTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCaseTab(t)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                        caseTab === t
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {t === 'permits'
                        ? `Permits (${activeCase.permits?.length ?? 0})`
                        : `Print Submissions (${activeCase.prints?.length ?? 0})`}
                    </button>
                  ))}
                </div>

                {caseTab === 'permits' && (
                  <Card>
                    <div className="mb-3 flex items-center justify-between">
                      <SectionTitle>Permits</SectionTitle>
                      <button
                        className={buttonClass}
                        onClick={() => handleAddPermit(activeCase.id)}
                        disabled={submitting}
                      >
                        Add Permit
                      </button>
                    </div>
                    {(activeCase.permits?.length ?? 0) === 0 ? (
                      <EmptyState title="No permits" hint="Add permits to track with authorities." />
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {activeCase.permits?.map((permit) => (
                          <li key={permit.id} className="flex items-center justify-between gap-3 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {permit.permitType}
                              </p>
                              <p className="text-xs text-gray-500">
                                {permit.authority ?? 'Authority TBD'}
                                {permit.referenceNo ? ` · Ref: ${permit.referenceNo}` : ''}
                                {permit.issuedAt
                                  ? ` · Issued ${formatDateTime(permit.issuedAt)}`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge tone={statusTone(permit.status)}>
                                {humanize(permit.status)}
                              </Badge>
                              {permit.status === 'PENDING' && (
                                <button
                                  className={secondaryButtonClass}
                                  onClick={() => handleUpdatePermit(permit.id, 'APPLIED')}
                                  disabled={submitting}
                                >
                                  Mark Applied
                                </button>
                              )}
                              {permit.status === 'APPLIED' && (
                                <button
                                  className={buttonClass}
                                  onClick={() => handleUpdatePermit(permit.id, 'ISSUED')}
                                  disabled={submitting}
                                >
                                  Mark Issued
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )}

                {caseTab === 'prints' && (
                  <Card>
                    <div className="mb-3 flex items-center justify-between">
                      <SectionTitle>Print Submissions</SectionTitle>
                      <button
                        className={buttonClass}
                        onClick={() => handleAddPrint(activeCase.id)}
                        disabled={submitting}
                      >
                        Add Print
                      </button>
                    </div>
                    {(activeCase.prints?.length ?? 0) === 0 ? (
                      <EmptyState
                        title="No prints"
                        hint="Add print submissions for council stamping."
                      />
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {activeCase.prints?.map((print) => (
                          <li key={print.id} className="flex items-center justify-between gap-3 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {print.documentName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Added {formatDateTime(print.createdAt)}
                              </p>
                            </div>
                            <Badge tone={statusTone(print.status)}>
                              {humanize(print.status)}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )}
              </>
            ) : null}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="Select a case"
              hint="Click an approval case on the left to view permits and print submissions."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

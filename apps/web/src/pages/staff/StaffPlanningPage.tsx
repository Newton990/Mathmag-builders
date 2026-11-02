// src/pages/staff/StaffPlanningPage.tsx
// Module 2 — Planning & Technical Design pipeline for a project.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type {
  ProjectDetail,
  DesignTask,
  DesignApproval,
  CoordinationIssue,
  CostEstimate,
  DesignChange,
  PlanningOverview,
  DesignDiscipline,
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
  buttonClass,
  linkClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

const DISCIPLINES: DesignDiscipline[] = [
  'ARCHITECTURAL_2D',
  'ARCHITECTURAL_3D',
  'STRUCTURAL',
  'MECHANICAL_PLUMBING',
  'ELECTRICAL',
  'QUANTITY_SURVEYING',
];

const DISCIPLINE_LABELS: Record<DesignDiscipline, string> = {
  ARCHITECTURAL_2D: '2D Arch',
  ARCHITECTURAL_3D: '3D Arch',
  STRUCTURAL: 'Structural',
  MECHANICAL_PLUMBING: 'MEP',
  ELECTRICAL: 'Electrical',
  QUANTITY_SURVEYING: 'QS',
};

type Tab = 'tasks' | 'approvals' | 'issues' | 'estimates' | 'changes';

export function StaffPlanningPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const project = useResource<{ project: ProjectDetail }>(
    projectId ? `/projects/${projectId}` : null,
  );
  const overview = useResource<{ data: PlanningOverview }>(
    projectId ? `/planning/projects/${projectId}/overview` : null,
  );
  const tasks = useResource<{ data: DesignTask[] }>(
    projectId && activeTab === 'tasks'
      ? `/planning/projects/${projectId}/tasks`
      : null,
  );
  const approvals = useResource<{ data: DesignApproval[] }>(
    projectId && activeTab === 'approvals'
      ? `/planning/projects/${projectId}/design-approvals`
      : null,
  );
  const issues = useResource<{ data: CoordinationIssue[] }>(
    projectId && activeTab === 'issues'
      ? `/planning/projects/${projectId}/coordination-issues`
      : null,
  );
  const estimates = useResource<{ data: CostEstimate[] }>(
    projectId && activeTab === 'estimates'
      ? `/planning/projects/${projectId}/estimates`
      : null,
  );
  const changes = useResource<{ data: DesignChange[] }>(
    projectId && activeTab === 'changes'
      ? `/planning/projects/${projectId}/design-changes`
      : null,
  );

  const proj = project.data?.project;
  const ov = overview.data?.data;

  async function initPackages() {
    if (!projectId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/planning/projects/${projectId}/packages/init`);
      overview.reload();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'approvals', label: 'Client Approvals' },
    { key: 'issues', label: 'Coordination Issues' },
    { key: 'estimates', label: 'Cost Estimates' },
    { key: 'changes', label: 'Design Changes' },
  ];

  const tabClass = (key: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === key
        ? 'border-brand-700 text-brand-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div>
      <PageHeader
        title={proj ? `Planning — ${proj.reference}` : 'Planning'}
        subtitle="Module 2 · Technical Design Pipeline"
        actions={
          <>
            {proj && (
              <Link to={`/staff/projects/${projectId}`} className={linkClass}>
                ← Project
              </Link>
            )}
          </>
        }
      />

      <ErrorBanner message={project.error ?? overview.error ?? submitError} />

      {project.loading || overview.loading ? (
        <Loading label="Loading planning overview…" />
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          {ov && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="2D client approval"
                value={ov.hasClientApproval2D ? 'Yes' : 'Pending'}
                tone={ov.hasClientApproval2D ? 'green' : 'amber'}
              />
              <StatCard
                label="3D client approval"
                value={ov.hasClientApproval3D ? 'Yes' : 'Pending'}
                tone={ov.hasClientApproval3D ? 'green' : 'amber'}
              />
              <StatCard
                label="Open issues"
                value={ov.openIssues}
                tone={ov.openIssues > 0 ? 'red' : 'green'}
              />
              <StatCard
                label="Latest estimate"
                value={ov.latestEstimate ? humanize(ov.latestEstimate.status) : 'None'}
                tone={
                  ov.latestEstimate?.status === 'APPROVED'
                    ? 'green'
                    : ov.latestEstimate
                    ? 'amber'
                    : 'gray'
                }
              />
            </div>
          )}

          {/* Discipline pipeline */}
          <Card>
            <SectionTitle>Design Pipeline</SectionTitle>
            {!ov || ov.packages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-gray-500">
                  No design packages initialised yet. Click below to set up the pipeline.
                </p>
                <button
                  className={buttonClass}
                  disabled={submitting}
                  onClick={initPackages}
                >
                  {submitting ? 'Initialising…' : 'Initialise design pipeline'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
                {DISCIPLINES.map((disc, idx) => {
                  const pkg = ov.packages.find((p) => p.discipline === disc);
                  const counts = ov.taskCounts[disc];
                  return (
                    <div
                      key={disc}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center"
                    >
                      <div className="mb-1 flex items-center justify-center gap-1 text-xs text-gray-400">
                        {idx > 0 && <span>→</span>}
                        <span className="font-semibold text-gray-700">
                          {DISCIPLINE_LABELS[disc]}
                        </span>
                      </div>
                      {pkg ? (
                        <>
                          <Badge tone={statusTone(pkg.status)}>
                            {humanize(pkg.status)}
                          </Badge>
                          {counts && (
                            <p className="mt-1 text-xs text-gray-500">
                              {counts.done}/{counts.total} tasks
                            </p>
                          )}
                          {pkg.releasedAt && (
                            <p className="mt-1 text-xs text-green-600">
                              Released {formatDateTime(pkg.releasedAt)}
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge tone="gray">Not started</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Tabs */}
          <div>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    className={tabClass(t.key)}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4">
              {/* Tasks tab */}
              {activeTab === 'tasks' && (
                <>
                  <ErrorBanner message={tasks.error} />
                  {tasks.loading ? (
                    <Loading label="Loading tasks…" />
                  ) : !tasks.data?.data?.length ? (
                    <EmptyState
                      title="No design tasks yet"
                      hint="Tasks are created by Lead Architects and discipline leads after initialising the pipeline."
                    />
                  ) : (
                    <div className="space-y-2">
                      {tasks.data.data.map((task) => (
                        <Card key={task.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="blue">
                                  {DISCIPLINE_LABELS[task.discipline]}
                                </Badge>
                                <span className="font-medium text-gray-900">
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {task.description}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                {task.assignee && (
                                  <span>Assignee: {task.assignee.name}</span>
                                )}
                                {task.plannedDeadline && (
                                  <span>
                                    Due: {formatDateTime(task.plannedDeadline)}
                                  </span>
                                )}
                                <span>
                                  Created: {formatDateTime(task.createdAt)}
                                </span>
                                {task._count && (
                                  <span>{task._count.reviews} review(s)</span>
                                )}
                              </div>
                            </div>
                            <Badge tone={statusTone(task.status)}>
                              {humanize(task.status)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Client Approvals tab */}
              {activeTab === 'approvals' && (
                <>
                  <ErrorBanner message={approvals.error} />
                  {approvals.loading ? (
                    <Loading label="Loading approvals…" />
                  ) : !approvals.data?.data?.length ? (
                    <EmptyState
                      title="No client design approvals recorded"
                      hint="2D approval is required before 3D work can begin."
                    />
                  ) : (
                    <div className="space-y-2">
                      {approvals.data.data.map((approval) => (
                        <Card key={approval.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="purple">
                                  {approval.type === 'TWO_D' ? '2D Approval' : '3D Approval'}
                                </Badge>
                                {approval.clientIdentity && (
                                  <span className="text-sm font-medium text-gray-900">
                                    {approval.clientIdentity}
                                  </span>
                                )}
                              </div>
                              {approval.evidenceNotes && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {approval.evidenceNotes}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                {approval.approvedAt && (
                                  <span>Approved: {formatDateTime(approval.approvedAt)}</span>
                                )}
                                {approval.approvedBy && (
                                  <span>By: {approval.approvedBy.name}</span>
                                )}
                              </div>
                            </div>
                            <Badge tone={statusTone(approval.status)}>
                              {humanize(approval.status)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Coordination Issues tab */}
              {activeTab === 'issues' && (
                <>
                  <ErrorBanner message={issues.error} />
                  {issues.loading ? (
                    <Loading label="Loading coordination issues…" />
                  ) : !issues.data?.data?.length ? (
                    <EmptyState
                      title="No coordination issues"
                      hint="Clashes, missing information and cross-discipline conflicts are logged here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {issues.data.data.map((issue) => (
                        <Card key={issue.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900">{issue.title}</span>
                              <p className="mt-1 text-sm text-gray-500">{issue.description}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                {issue.severity && <span>Severity: {issue.severity}</span>}
                                {issue.owner && <span>Owner: {issue.owner.name}</span>}
                                {issue.dueDate && (
                                  <span>Due: {formatDateTime(issue.dueDate)}</span>
                                )}
                                {issue.resolvedAt && (
                                  <span>Resolved: {formatDateTime(issue.resolvedAt)}</span>
                                )}
                              </div>
                              {issue.resolutionNotes && (
                                <p className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                                  Resolution: {issue.resolutionNotes}
                                </p>
                              )}
                            </div>
                            <Badge tone={statusTone(issue.status)}>
                              {humanize(issue.status)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Cost Estimates tab */}
              {activeTab === 'estimates' && (
                <>
                  <ErrorBanner message={estimates.error} />
                  {estimates.loading ? (
                    <Loading label="Loading cost estimates…" />
                  ) : !estimates.data?.data?.length ? (
                    <EmptyState
                      title="No cost estimates yet"
                      hint="Lead QS prepares estimates after all four discipline packages are released."
                    />
                  ) : (
                    <div className="space-y-3">
                      {estimates.data.data.map((est) => (
                        <Card key={est.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={est.isSummary ? 'blue' : 'purple'}>
                                  {est.isSummary ? 'Summary budget' : 'Detailed budget'}
                                </Badge>
                                {est.totalAmount && (
                                  <span className="font-semibold text-gray-900">
                                    {est.currency} {Number(est.totalAmount).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {est.assumptions && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Assumptions: {est.assumptions}
                                </p>
                              )}
                              {est.exclusions && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Exclusions: {est.exclusions}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                <span>By: {est.createdBy.name}</span>
                                <span>{formatDateTime(est.createdAt)}</span>
                                {est.approvedBy && (
                                  <span>Approved by: {est.approvedBy.name}</span>
                                )}
                              </div>
                              {est.lines && est.lines.length > 0 && (
                                <div className="mt-3 overflow-x-auto rounded border border-gray-100">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50 text-gray-500">
                                      <tr>
                                        <th className="px-3 py-1 text-left">Description</th>
                                        <th className="px-3 py-1 text-right">Qty</th>
                                        <th className="px-3 py-1 text-left">Unit</th>
                                        <th className="px-3 py-1 text-right">Rate</th>
                                        <th className="px-3 py-1 text-right">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {est.lines.map((line) => (
                                        <tr key={line.id}>
                                          <td className="px-3 py-1">{line.description}</td>
                                          <td className="px-3 py-1 text-right">{line.quantity}</td>
                                          <td className="px-3 py-1">{line.unit}</td>
                                          <td className="px-3 py-1 text-right">
                                            {Number(line.unitRate).toLocaleString()}
                                          </td>
                                          <td className="px-3 py-1 text-right font-medium">
                                            {Number(line.amount).toLocaleString()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                            <Badge tone={statusTone(est.status)}>
                              {humanize(est.status)}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Design Changes tab */}
              {activeTab === 'changes' && (
                <>
                  <ErrorBanner message={changes.error} />
                  {changes.loading ? (
                    <Loading label="Loading design changes…" />
                  ) : !changes.data?.data?.length ? (
                    <EmptyState
                      title="No design changes requested"
                      hint="Minor and major design changes are tracked here with their management decisions."
                    />
                  ) : (
                    <div className="space-y-2">
                      {changes.data.data.map((change) => (
                        <Card key={change.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  tone={change.changeType === 'MAJOR' ? 'red' : 'amber'}
                                >
                                  {change.changeType === 'MAJOR' ? 'Major change' : 'Minor change'}
                                </Badge>
                                {change.requiresClientReacceptance && (
                                  <Badge tone="purple">Requires client re-acceptance</Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-700">{change.reason}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                {change.feeImpact && (
                                  <span>Fee impact: KES {Number(change.feeImpact).toLocaleString()}</span>
                                )}
                                {change.timeImpactDays != null && (
                                  <span>Time impact: {change.timeImpactDays} day(s)</span>
                                )}
                                <span>Requested by: {change.requestedBy.name}</span>
                                <span>{formatDateTime(change.createdAt)}</span>
                              </div>
                              {change.decision && (
                                <p className="mt-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
                                  Decision: {change.decision}
                                  {change.decidedBy && ` — ${change.decidedBy.name}`}
                                  {change.decidedAt && ` on ${formatDateTime(change.decidedAt)}`}
                                </p>
                              )}
                            </div>
                            <Badge tone={change.decision ? 'green' : 'amber'}>
                              {change.decision ? 'Decided' : 'Pending decision'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

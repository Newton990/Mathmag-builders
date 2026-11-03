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
  Field,
  Loading,
  PageHeader,
  SectionTitle,
  StatCard,
  buttonClass,
  inputClass,
  linkClass,
  secondaryButtonClass,
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

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type Tab = 'tasks' | 'approvals' | 'issues' | 'estimates' | 'changes';

// ── Inline form components ───────────────────────────────────────────────────

function CreateTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: { discipline: string; title: string; description: string; plannedDeadline: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [discipline, setDiscipline] = useState<string>('ARCHITECTURAL_2D');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setErr('Title is required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSubmit({
        discipline,
        title,
        description,
        plannedDeadline: deadline ? new Date(deadline).toISOString() : '',
      });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Discipline *">
          <select className={inputClass} value={discipline} onChange={e => setDiscipline(e.target.value)}>
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{DISCIPLINE_LABELS[d]}</option>
            ))}
          </select>
        </Field>
        <Field label="Deadline">
          <input className={inputClass} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </Field>
      </div>
      <Field label="Title *">
        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title…" />
      </Field>
      <Field label="Description">
        <textarea className={inputClass + ' h-20 resize-none'} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional detail…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ReviewTaskForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (decision: 'APPROVED' | 'RETURNED', comments: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [decision, setDecision] = useState<'APPROVED' | 'RETURNED'>('APPROVED');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!comments.trim()) { setErr('Comments are required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit(decision, comments); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <ErrorBanner message={err} />
      <Field label="Decision">
        <div className="flex gap-3">
          {(['APPROVED', 'RETURNED'] as const).map(d => (
            <label key={d} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="decision" value={d} checked={decision === d} onChange={() => setDecision(d)} />
              {d === 'APPROVED' ? '✅ Approve' : '↩ Return'}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Comments *">
        <textarea className={inputClass + ' h-16 resize-none'} value={comments} onChange={e => setComments(e.target.value)} placeholder="Review notes…" />
      </Field>
      <div className="flex gap-2">
        <button className={decision === 'APPROVED' ? buttonClass : 'rounded px-3 py-1.5 text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors'} onClick={save} disabled={saving}>
          {saving ? 'Submitting…' : decision === 'APPROVED' ? 'Approve Task' : 'Return Task'}
        </button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function RecordApprovalForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: { type: string; evidenceNotes: string; clientIdentity: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<'TWO_D' | 'THREE_D'>('TWO_D');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [clientIdentity, setClientIdentity] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true); setErr(null);
    try { await onSubmit({ type, evidenceNotes, clientIdentity }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Approval type">
        <div className="flex gap-4">
          {(['TWO_D', 'THREE_D'] as const).map(t => (
            <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="approvalType" value={t} checked={type === t} onChange={() => setType(t)} />
              {t === 'TWO_D' ? '2D Drawings' : '3D Visualisation'}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Client name / identity">
        <input className={inputClass} value={clientIdentity} onChange={e => setClientIdentity(e.target.value)} placeholder="Client full name or ID…" />
      </Field>
      <Field label="Evidence notes">
        <textarea className={inputClass + ' h-16 resize-none'} value={evidenceNotes} onChange={e => setEvidenceNotes(e.target.value)} placeholder="How approval was recorded (email, meeting, signed copy…)" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Recording…' : 'Record Approval'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LogIssueForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (d: { title: string; description: string; severity: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setErr('Title is required'); return; }
    if (!description.trim()) { setErr('Description is required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ title, description, severity }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title *">
          <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title…" />
        </Field>
        <Field label="Severity">
          <select className={inputClass} value={severity} onChange={e => setSeverity(e.target.value)}>
            {SEVERITIES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description *">
        <textarea className={inputClass + ' h-20 resize-none'} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the coordination clash or issue…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Logging…' : 'Log Issue'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function StaffPlanningPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inline form visibility
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

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

  async function handleCreateTask(d: { discipline: string; title: string; description: string; plannedDeadline: string }) {
    if (!projectId) return;
    await api.post(`/planning/projects/${projectId}/tasks`, d);
    tasks.reload();
    setShowTaskForm(false);
  }

  async function handleSubmitTask(taskId: string) {
    setSubmittingTaskId(taskId);
    setSubmitError(null);
    try {
      await api.post(`/planning/tasks/${taskId}/submit`, {});
      tasks.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmittingTaskId(null); }
  }

  async function handleReviewTask(taskId: string, decision: 'APPROVED' | 'RETURNED', comments: string) {
    await api.post(`/planning/tasks/${taskId}/review`, { decision, comments });
    tasks.reload();
    setReviewingTaskId(null);
  }

  async function handleRecordApproval(d: { type: string; evidenceNotes: string; clientIdentity: string }) {
    if (!projectId) return;
    await api.post(`/planning/projects/${projectId}/design-approvals`, d);
    approvals.reload();
    overview.reload();
    setShowApprovalForm(false);
  }

  async function handleLogIssue(d: { title: string; description: string; severity: string }) {
    if (!projectId) return;
    await api.post(`/planning/projects/${projectId}/coordination-issues`, d);
    issues.reload();
    overview.reload();
    setShowIssueForm(false);
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
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <SectionTitle>Design Tasks</SectionTitle>
                        <button className={buttonClass} onClick={() => setShowTaskForm(v => !v)}>
                          {showTaskForm ? 'Cancel' : '+ Create Task'}
                        </button>
                      </div>
                      {showTaskForm && (
                        <div className="mb-4">
                          <CreateTaskForm
                            onSubmit={handleCreateTask}
                            onCancel={() => setShowTaskForm(false)}
                          />
                        </div>
                      )}
                      {!tasks.data?.data?.length ? (
                        <EmptyState
                          title="No design tasks yet"
                          hint="Create a task to assign work to a discipline lead."
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
                                  {/* Inline review form */}
                                  {reviewingTaskId === task.id && (
                                    <ReviewTaskForm
                                      onSubmit={(decision, comments) => handleReviewTask(task.id, decision, comments)}
                                      onCancel={() => setReviewingTaskId(null)}
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge tone={statusTone(task.status)}>
                                    {humanize(task.status)}
                                  </Badge>
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    {(task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED') && reviewingTaskId !== task.id && (
                                      <button
                                        className={secondaryButtonClass}
                                        onClick={() => handleSubmitTask(task.id)}
                                        disabled={submittingTaskId === task.id}
                                      >
                                        {submittingTaskId === task.id ? 'Submitting…' : 'Submit for Review'}
                                      </button>
                                    )}
                                    {task.status === 'SUBMITTED_FOR_REVIEW' && reviewingTaskId !== task.id && (
                                      <button
                                        className={buttonClass}
                                        onClick={() => setReviewingTaskId(task.id)}
                                      >
                                        Review
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Client Approvals tab */}
              {activeTab === 'approvals' && (
                <>
                  <ErrorBanner message={approvals.error} />
                  {approvals.loading ? (
                    <Loading label="Loading approvals…" />
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <SectionTitle>Client Design Approvals</SectionTitle>
                        <button className={buttonClass} onClick={() => setShowApprovalForm(v => !v)}>
                          {showApprovalForm ? 'Cancel' : '+ Record Approval'}
                        </button>
                      </div>
                      {showApprovalForm && (
                        <div className="mb-4">
                          <RecordApprovalForm
                            onSubmit={handleRecordApproval}
                            onCancel={() => setShowApprovalForm(false)}
                          />
                        </div>
                      )}
                      {!approvals.data?.data?.length ? (
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
                </>
              )}

              {/* Coordination Issues tab */}
              {activeTab === 'issues' && (
                <>
                  <ErrorBanner message={issues.error} />
                  {issues.loading ? (
                    <Loading label="Loading coordination issues…" />
                  ) : (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <SectionTitle>Coordination Issues</SectionTitle>
                        <button className={buttonClass} onClick={() => setShowIssueForm(v => !v)}>
                          {showIssueForm ? 'Cancel' : '+ Log Issue'}
                        </button>
                      </div>
                      {showIssueForm && (
                        <div className="mb-4">
                          <LogIssueForm
                            onSubmit={handleLogIssue}
                            onCancel={() => setShowIssueForm(false)}
                          />
                        </div>
                      )}
                      {!issues.data?.data?.length ? (
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

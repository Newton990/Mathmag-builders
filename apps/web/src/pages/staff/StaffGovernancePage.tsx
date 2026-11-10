// src/pages/staff/StaffGovernancePage.tsx
// Module 7 — Central Administration & Governance.
// Covers: delegations, acting authorities, exceptions, protected audits,
// leave requests, purchase requisitions, and purchase orders.
import { useState } from 'react';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type {
  Delegation,
  ActingAuthority,
  GovernanceException,
  ProtectedAuditCase,
  LeaveRequest,
  PurchaseRequisition,
  PurchaseOrder,
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
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

type Tab =
  | 'delegations'
  | 'acting'
  | 'exceptions'
  | 'audits'
  | 'leave'
  | 'requisitions'
  | 'purchase-orders';

// ── Inline form components ────────────────────────────────────────────────────

function DelegationForm({ onSubmit, onCancel }: {
  onSubmit: (d: { delegateId: string; valueLimit?: number; riskCategory?: string; expiresAt?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [delegateId, setDelegateId] = useState('');
  const [valueLimit, setValueLimit] = useState('');
  const [riskCategory, setRiskCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!delegateId.trim()) { setErr('Delegate user ID is required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSubmit({
        delegateId: delegateId.trim(),
        ...(valueLimit ? { valueLimit: Number(valueLimit) } : {}),
        ...(riskCategory.trim() ? { riskCategory: riskCategory.trim() } : {}),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Delegate user ID *">
        <input className={inputClass} value={delegateId} onChange={e => setDelegateId(e.target.value)} placeholder="UUID of the delegate…" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Value limit (KES)">
          <input className={inputClass} type="number" value={valueLimit} onChange={e => setValueLimit(e.target.value)} placeholder="Optional…" />
        </Field>
        <Field label="Risk category">
          <input className={inputClass} value={riskCategory} onChange={e => setRiskCategory(e.target.value)} placeholder="e.g. HIGH…" />
        </Field>
        <Field label="Expires at">
          <input className={inputClass} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create Delegation'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ActingAuthorityForm({ onSubmit, onCancel }: {
  onSubmit: (d: { actingId: string; reason: string; expiresAt?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [actingId, setActingId] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!actingId.trim()) { setErr('Acting user ID is required'); return; }
    if (!reason.trim()) { setErr('Reason is required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSubmit({
        actingId: actingId.trim(),
        reason: reason.trim(),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Acting user ID *">
          <input className={inputClass} value={actingId} onChange={e => setActingId(e.target.value)} placeholder="UUID of acting person…" />
        </Field>
        <Field label="Expires at">
          <input className={inputClass} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Reason *">
        <textarea className={inputClass + ' h-16 resize-none'} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for acting arrangement…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create Acting Authority'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ExceptionForm({ onSubmit, onCancel }: {
  onSubmit: (d: { reason: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!reason.trim()) { setErr('Reason is required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ reason: reason.trim() }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Reason / justification *">
        <textarea className={inputClass + ' h-20 resize-none'} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the exception being requested…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Requesting…' : 'Request Exception'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ProtectedAuditForm({ onSubmit, onCancel }: {
  onSubmit: (d: { title: string; description?: string; severity?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setErr('Title is required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSubmit({ title: title.trim(), ...(description.trim() ? { description: description.trim() } : {}), severity });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title *">
          <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Audit case title…" />
        </Field>
        <Field label="Severity">
          <select className={inputClass} value={severity} onChange={e => setSeverity(e.target.value)}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
              <option key={s} value={s}>{humanize(s)}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea className={inputClass + ' h-16 resize-none'} value={description} onChange={e => setDescription(e.target.value)} placeholder="Details of the audit case…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Opening…' : 'Open Audit Case'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LeaveForm({ onSubmit, onCancel }: {
  onSubmit: (d: { startDate: string; endDate: string; reason?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!startDate || !endDate) { setErr('Start and end dates are required'); return; }
    setSaving(true); setErr(null);
    try {
      await onSubmit({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date *">
          <input className={inputClass} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date *">
          <input className={inputClass} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Reason">
        <textarea className={inputClass + ' h-16 resize-none'} value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Requesting…' : 'Request Leave'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function RequisitionForm({ onSubmit, onCancel }: {
  onSubmit: (d: { notes?: string; totalAmount?: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true); setErr(null);
    try {
      await onSubmit({
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(totalAmount ? { totalAmount: Number(totalAmount) } : {}),
      });
    } catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Total amount (KES)">
        <input className={inputClass} type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" />
      </Field>
      <Field label="Notes">
        <textarea className={inputClass + ' h-16 resize-none'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Items or description of the requisition…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Submitting…' : 'Submit Requisition'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function StaffGovernancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('delegations');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Form visibility toggles
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [showActingForm, setShowActingForm] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);

  // Data resources
  const delegations = useResource<{ data: Delegation[] }>(
    activeTab === 'delegations' ? '/governance/delegations' : null,
  );
  const actingAuthorities = useResource<{ data: ActingAuthority[] }>(
    activeTab === 'acting' ? '/governance/acting-authorities' : null,
  );
  const exceptions = useResource<{ data: GovernanceException[] }>(
    activeTab === 'exceptions' ? '/governance/exceptions' : null,
  );
  const audits = useResource<{ data: ProtectedAuditCase[] }>(
    activeTab === 'audits' ? '/governance/protected-audits' : null,
  );
  const leave = useResource<{ data: LeaveRequest[] }>(
    activeTab === 'leave' ? '/governance/leave' : null,
  );
  const requisitions = useResource<{ data: PurchaseRequisition[] }>(
    activeTab === 'requisitions' ? '/governance/requisitions' : null,
  );
  const purchaseOrders = useResource<{ data: PurchaseOrder[] }>(
    activeTab === 'purchase-orders' ? '/governance/purchase-orders' : null,
  );

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function handleCreateDelegation(d: { delegateId: string; valueLimit?: number; riskCategory?: string; expiresAt?: string }) {
    await api.post('/governance/delegations', d);
    delegations.reload();
    setShowDelegationForm(false);
  }

  async function handleCreateActing(d: { actingId: string; reason: string; expiresAt?: string }) {
    await api.post('/governance/acting-authorities', d);
    actingAuthorities.reload();
    setShowActingForm(false);
  }

  async function handleActivateActing(id: string) {
    setActionId(id); setActionError(null);
    try {
      await api.post(`/governance/acting-authorities/${id}/activate`, {});
      actingAuthorities.reload();
    } catch (e) { setActionError(errorMessage(e)); }
    finally { setActionId(null); }
  }

  async function handleCreateException(d: { reason: string }) {
    await api.post('/governance/exceptions', d);
    exceptions.reload();
    setShowExceptionForm(false);
  }

  async function handleApproveException(id: string) {
    setActionId(id); setActionError(null);
    try {
      await api.post(`/governance/exceptions/${id}/approve`, {});
      exceptions.reload();
    } catch (e) { setActionError(errorMessage(e)); }
    finally { setActionId(null); }
  }

  async function handleCreateAudit(d: { title: string; description?: string; severity?: string }) {
    await api.post('/governance/protected-audits', d);
    audits.reload();
    setShowAuditForm(false);
  }

  async function handleTriageAudit(id: string) {
    setActionId(id); setActionError(null);
    try {
      await api.post(`/governance/protected-audits/${id}/triage`, {});
      audits.reload();
    } catch (e) { setActionError(errorMessage(e)); }
    finally { setActionId(null); }
  }

  async function handleCreateLeave(d: { startDate: string; endDate: string; reason?: string }) {
    await api.post('/governance/leave', d);
    leave.reload();
    setShowLeaveForm(false);
  }

  async function handleApproveLeave(id: string) {
    setActionId(id); setActionError(null);
    try {
      await api.post(`/governance/leave/${id}/approve`, {});
      leave.reload();
    } catch (e) { setActionError(errorMessage(e)); }
    finally { setActionId(null); }
  }

  async function handleCreateReq(d: { notes?: string; totalAmount?: number }) {
    await api.post('/governance/requisitions', d);
    requisitions.reload();
    setShowReqForm(false);
  }

  async function handleApproveReq(id: string) {
    setActionId(id); setActionError(null);
    try {
      await api.post(`/governance/requisitions/${id}/approve`, {});
      requisitions.reload();
    } catch (e) { setActionError(errorMessage(e)); }
    finally { setActionId(null); }
  }

  // ── Tab helpers ─────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: 'delegations', label: 'Delegations' },
    { key: 'acting', label: 'Acting Authorities' },
    { key: 'exceptions', label: 'Exceptions' },
    { key: 'audits', label: 'Protected Audits' },
    { key: 'leave', label: 'Leave' },
    { key: 'requisitions', label: 'Requisitions' },
    { key: 'purchase-orders', label: 'Purchase Orders' },
  ];

  const tabClass = (key: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      activeTab === key
        ? 'border-brand-700 text-brand-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  // ── Summary stats (computed from loaded data) ───────────────────────────────
  const activeDelegations = delegations.data?.data?.filter(d => d.status === 'ACTIVE').length ?? 0;
  const pendingExceptions  = exceptions.data?.data?.filter(e => e.status === 'PENDING').length ?? 0;
  const openAudits         = audits.data?.data?.filter(a => a.status === 'OPEN').length ?? 0;
  const pendingLeave       = leave.data?.data?.filter(l => l.status === 'PENDING').length ?? 0;

  return (
    <div>
      <PageHeader
        title="Governance & Administration"
        subtitle="Module 7 · Delegations, exceptions, audits, leave & procurement"
      />

      <ErrorBanner message={actionError} />

      {/* Summary stat cards — only shown when relevant data is loaded */}
      {(delegations.data || exceptions.data || audits.data || leave.data) && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Active delegations" value={activeDelegations} tone={activeDelegations > 0 ? 'blue' : 'gray'} />
          <StatCard label="Pending exceptions" value={pendingExceptions} tone={pendingExceptions > 0 ? 'amber' : 'green'} />
          <StatCard label="Open audit cases" value={openAudits} tone={openAudits > 0 ? 'red' : 'green'} />
          <StatCard label="Pending leave" value={pendingLeave} tone={pendingLeave > 0 ? 'amber' : 'gray'} />
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} className={tabClass(t.key)} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4 space-y-4">

        {/* ── Delegations ── */}
        {activeTab === 'delegations' && (
          <>
            <ErrorBanner message={delegations.error} />
            {delegations.loading ? (
              <Loading label="Loading delegations…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Delegation Mandates</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowDelegationForm(v => !v)}>
                    {showDelegationForm ? 'Cancel' : '+ New Delegation'}
                  </button>
                </div>
                {showDelegationForm && (
                  <DelegationForm
                    onSubmit={handleCreateDelegation}
                    onCancel={() => setShowDelegationForm(false)}
                  />
                )}
                {!delegations.data?.data?.length ? (
                  <EmptyState title="No delegations" hint="Create a delegation mandate to allow another staff member to act with your authority." />
                ) : (
                  <div className="space-y-2">
                    {delegations.data!.data.map(d => (
                      <Card key={d.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm">Delegate: <code className="text-xs bg-gray-100 rounded px-1">{d.delegateId}</code></span>
                              {d.riskCategory && <Badge tone="blue">{d.riskCategory}</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {d.valueLimit != null && <span>Value limit: KES {d.valueLimit.toLocaleString()}</span>}
                              {d.expiresAt && <span>Expires: {formatDateTime(d.expiresAt)}</span>}
                              <span>Created: {formatDateTime(d.createdAt)}</span>
                            </div>
                          </div>
                          <Badge tone={statusTone(d.status)}>{humanize(d.status)}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Acting Authorities ── */}
        {activeTab === 'acting' && (
          <>
            <ErrorBanner message={actingAuthorities.error} />
            {actingAuthorities.loading ? (
              <Loading label="Loading acting authorities…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Acting Authorities</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowActingForm(v => !v)}>
                    {showActingForm ? 'Cancel' : '+ New Acting Authority'}
                  </button>
                </div>
                {showActingForm && (
                  <ActingAuthorityForm
                    onSubmit={handleCreateActing}
                    onCancel={() => setShowActingForm(false)}
                  />
                )}
                {!actingAuthorities.data?.data?.length ? (
                  <EmptyState title="No acting authorities" hint="Create an acting authority arrangement when a principal is temporarily unavailable." />
                ) : (
                  <div className="space-y-2">
                    {actingAuthorities.data!.data.map(a => (
                      <Card key={a.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              Acting: <code className="text-xs bg-gray-100 rounded px-1">{a.actingId}</code>
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{a.reason}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {a.activatedAt && <span>Activated: {formatDateTime(a.activatedAt)}</span>}
                              {a.expiresAt && <span>Expires: {formatDateTime(a.expiresAt)}</span>}
                              <span>Created: {formatDateTime(a.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge tone={statusTone(a.status)}>{humanize(a.status)}</Badge>
                            {a.status === 'PENDING' && (
                              <button
                                className={buttonClass}
                                onClick={() => handleActivateActing(a.id)}
                                disabled={actionId === a.id}
                              >
                                {actionId === a.id ? 'Activating…' : 'Activate'}
                              </button>
                            )}
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

        {/* ── Exceptions ── */}
        {activeTab === 'exceptions' && (
          <>
            <ErrorBanner message={exceptions.error} />
            {exceptions.loading ? (
              <Loading label="Loading exceptions…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Policy Exceptions</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowExceptionForm(v => !v)}>
                    {showExceptionForm ? 'Cancel' : '+ Request Exception'}
                  </button>
                </div>
                {showExceptionForm && (
                  <ExceptionForm
                    onSubmit={handleCreateException}
                    onCancel={() => setShowExceptionForm(false)}
                  />
                )}
                {!exceptions.data?.data?.length ? (
                  <EmptyState title="No exceptions" hint="Request a policy exception when standard rules cannot be followed for a specific case." />
                ) : (
                  <div className="space-y-2">
                    {exceptions.data!.data.map(e => (
                      <Card key={e.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900">{e.reason}</p>
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {e.approvedAt && <span>Approved: {formatDateTime(e.approvedAt)}</span>}
                              <span>Requested: {formatDateTime(e.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge tone={statusTone(e.status)}>{humanize(e.status)}</Badge>
                            {e.status === 'PENDING' && (
                              <button
                                className={buttonClass}
                                onClick={() => handleApproveException(e.id)}
                                disabled={actionId === e.id}
                              >
                                {actionId === e.id ? 'Approving…' : 'Approve'}
                              </button>
                            )}
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

        {/* ── Protected Audits ── */}
        {activeTab === 'audits' && (
          <>
            <ErrorBanner message={audits.error} />
            {audits.loading ? (
              <Loading label="Loading audit cases…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Protected Audit Cases</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowAuditForm(v => !v)}>
                    {showAuditForm ? 'Cancel' : '+ Open Audit Case'}
                  </button>
                </div>
                {showAuditForm && (
                  <ProtectedAuditForm
                    onSubmit={handleCreateAudit}
                    onCancel={() => setShowAuditForm(false)}
                  />
                )}
                {!audits.data?.data?.length ? (
                  <EmptyState title="No audit cases" hint="Protected audit cases track serious internal governance matters." />
                ) : (
                  <div className="space-y-2">
                    {audits.data!.data.map(a => (
                      <Card key={a.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-gray-400">{a.caseNumber}</span>
                              <span className="font-medium text-gray-900">{a.title}</span>
                              {a.severity && <Badge tone={a.severity === 'CRITICAL' ? 'red' : a.severity === 'HIGH' ? 'amber' : 'gray'}>{humanize(a.severity)}</Badge>}
                            </div>
                            {a.description && <p className="mt-1 text-sm text-gray-500">{a.description}</p>}
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {a.triagedAt && <span>Triaged: {formatDateTime(a.triagedAt)}</span>}
                              <span>Opened: {formatDateTime(a.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge tone={statusTone(a.status)}>{humanize(a.status)}</Badge>
                            {a.status === 'OPEN' && (
                              <button
                                className={secondaryButtonClass}
                                onClick={() => handleTriageAudit(a.id)}
                                disabled={actionId === a.id}
                              >
                                {actionId === a.id ? 'Triaging…' : 'Triage'}
                              </button>
                            )}
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

        {/* ── Leave ── */}
        {activeTab === 'leave' && (
          <>
            <ErrorBanner message={leave.error} />
            {leave.loading ? (
              <Loading label="Loading leave requests…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Leave Requests</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowLeaveForm(v => !v)}>
                    {showLeaveForm ? 'Cancel' : '+ Request Leave'}
                  </button>
                </div>
                {showLeaveForm && (
                  <LeaveForm
                    onSubmit={handleCreateLeave}
                    onCancel={() => setShowLeaveForm(false)}
                  />
                )}
                {!leave.data?.data?.length ? (
                  <EmptyState title="No leave requests" hint="Staff leave requests are managed here for planning and coverage purposes." />
                ) : (
                  <div className="space-y-2">
                    {leave.data!.data.map(l => (
                      <Card key={l.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {formatDateTime(l.startDate)} → {formatDateTime(l.endDate)}
                            </p>
                            {l.reason && <p className="mt-1 text-sm text-gray-500">{l.reason}</p>}
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {l.approvedAt && <span>Approved: {formatDateTime(l.approvedAt)}</span>}
                              <span>Requested: {formatDateTime(l.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge tone={statusTone(l.status)}>{humanize(l.status)}</Badge>
                            {l.status === 'PENDING' && (
                              <button
                                className={buttonClass}
                                onClick={() => handleApproveLeave(l.id)}
                                disabled={actionId === l.id}
                              >
                                {actionId === l.id ? 'Approving…' : 'Approve'}
                              </button>
                            )}
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

        {/* ── Requisitions ── */}
        {activeTab === 'requisitions' && (
          <>
            <ErrorBanner message={requisitions.error} />
            {requisitions.loading ? (
              <Loading label="Loading requisitions…" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <SectionTitle>Purchase Requisitions</SectionTitle>
                  <button className={buttonClass} onClick={() => setShowReqForm(v => !v)}>
                    {showReqForm ? 'Cancel' : '+ New Requisition'}
                  </button>
                </div>
                {showReqForm && (
                  <RequisitionForm
                    onSubmit={handleCreateReq}
                    onCancel={() => setShowReqForm(false)}
                  />
                )}
                {!requisitions.data?.data?.length ? (
                  <EmptyState title="No requisitions" hint="Purchase requisitions are submitted here for management approval before a PO is raised." />
                ) : (
                  <div className="space-y-2">
                    {requisitions.data!.data.map(r => (
                      <Card key={r.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-gray-400">{r.requisitionNo}</span>
                              {r.totalAmount != null && (
                                <span className="font-semibold text-gray-900">
                                  {r.currency} {r.totalAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {r.notes && <p className="mt-1 text-sm text-gray-500">{r.notes}</p>}
                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                              {r.approvedAt && <span>Approved: {formatDateTime(r.approvedAt)}</span>}
                              <span>Created: {formatDateTime(r.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge tone={statusTone(r.status)}>{humanize(r.status)}</Badge>
                            {r.status === 'SUBMITTED' && (
                              <button
                                className={buttonClass}
                                onClick={() => handleApproveReq(r.id)}
                                disabled={actionId === r.id}
                              >
                                {actionId === r.id ? 'Approving…' : 'Approve'}
                              </button>
                            )}
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

        {/* ── Purchase Orders ── */}
        {activeTab === 'purchase-orders' && (
          <>
            <ErrorBanner message={purchaseOrders.error} />
            {purchaseOrders.loading ? (
              <Loading label="Loading purchase orders…" />
            ) : !purchaseOrders.data?.data?.length ? (
              <EmptyState
                title="No purchase orders"
                hint="Purchase orders are raised from approved requisitions by the finance team."
              />
            ) : (
              <div className="space-y-2">
                {purchaseOrders.data!.data.map(po => (
                  <Card key={po.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-gray-400">{po.poNumber}</span>
                          {po.totalAmount != null && (
                            <span className="font-semibold text-gray-900">
                              {po.currency} {po.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                          {po.supplierId && <span>Supplier: <code className="text-xs bg-gray-100 rounded px-1">{po.supplierId}</code></span>}
                          {po.requisitionId && <span>Req: <code className="text-xs bg-gray-100 rounded px-1">{po.requisitionId.slice(0, 8)}…</code></span>}
                          <span>Created: {formatDateTime(po.createdAt)}</span>
                        </div>
                      </div>
                      <Badge tone={statusTone(po.status)}>{humanize(po.status)}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

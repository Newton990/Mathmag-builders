// src/pages/staff/StaffConstructionPage.tsx
// Module 6 — Construction Management for a project.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type {
  ProjectDetail,
  Mobilization,
  SiteLog,
  GRN,
  WorkHold,
  Variation,
  Handover,
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
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, formatKes, humanize } from '../../lib/format';

type Tab = 'overview' | 'site-logs' | 'grns' | 'holds' | 'variations' | 'handover';

// ── Inline form components ───────────────────────────────────────────────────

function SiteLogForm({ onSubmit, onCancel }: { onSubmit: (d: { workSummary: string; weather: string; issues: string }) => Promise<void>; onCancel: () => void }) {
  const [workSummary, setWorkSummary] = useState('');
  const [weather, setWeather] = useState('');
  const [issues, setIssues] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!workSummary.trim()) { setErr('Work summary is required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ workSummary, weather, issues }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Work summary *"><textarea className={inputClass + ' h-24 resize-none'} value={workSummary} onChange={e => setWorkSummary(e.target.value)} placeholder="Describe today's work…" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Weather"><input className={inputClass} value={weather} onChange={e => setWeather(e.target.value)} placeholder="Sunny, rainy…" /></Field>
        <Field label="Issues / observations"><input className={inputClass} value={issues} onChange={e => setIssues(e.target.value)} placeholder="Any site issues…" /></Field>
      </div>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add Log'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function GRNForm({ onSubmit, onCancel }: { onSubmit: (d: { supplier: string; poNumber: string; notes: string }) => Promise<void>; onCancel: () => void }) {
  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!supplier.trim()) { setErr('Supplier name is required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ supplier, poNumber, notes }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Supplier *"><input className={inputClass} value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" /></Field>
        <Field label="PO Number"><input className={inputClass} value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Optional PO number" /></Field>
      </div>
      <Field label="Notes"><input className={inputClass} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery notes…" /></Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create GRN'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function WorkHoldForm({ onSubmit, onCancel }: { onSubmit: (d: { reason: string }) => Promise<void>; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!reason.trim()) { setErr('Reason is required'); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ reason }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Reason for work hold *"><textarea className={inputClass + ' h-20 resize-none'} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why work is being halted…" /></Field>
      <div className="flex gap-2">
        <button className={dangerButtonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Issue Hold'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LiftHoldForm({ onSubmit, onCancel }: { onSubmit: (d: { clearanceNotes: string }) => Promise<void>; onCancel: () => void }) {
  const [clearanceNotes, setClearanceNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true); setErr(null);
    try { await onSubmit({ clearanceNotes }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2 mt-2">
      <ErrorBanner message={err} />
      <Field label="Clearance notes"><input className={inputClass} value={clearanceNotes} onChange={e => setClearanceNotes(e.target.value)} placeholder="Optional notes about clearing the hold…" /></Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Lifting…' : 'Lift Hold'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function VariationForm({ onSubmit, onCancel }: { onSubmit: (d: { title: string; description: string; value: number | undefined }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) { setErr('Title is required'); return; }
    const value = valueStr ? parseFloat(valueStr) : undefined;
    setSaving(true); setErr(null);
    try { await onSubmit({ title, description, value }); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Variation title *"><input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title of the scope change…" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Value (KES)"><input className={inputClass} type="number" value={valueStr} onChange={e => setValueStr(e.target.value)} placeholder="0.00" /></Field>
        <Field label="Description"><input className={inputClass} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional detail…" /></Field>
      </div>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Submit Variation'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function StaffConstructionPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inline form visibility
  const [showLogForm, setShowLogForm] = useState(false);
  const [showGRNForm, setShowGRNForm] = useState(false);
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [liftingHoldId, setLiftingHoldId] = useState<string | null>(null);

  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const mobilization = useResource<{ data: Mobilization | null }>(
    id ? `/construction/projects/${id}/mobilization` : null,
  );
  const siteLogs = useResource<{ data: SiteLog[] }>(
    id && (tab === 'site-logs' || tab === 'overview') ? `/construction/projects/${id}/site-logs` : null,
  );
  const grns = useResource<{ data: GRN[] }>(
    id && tab === 'grns' ? `/construction/projects/${id}/grns` : null,
  );
  const holds = useResource<{ data: WorkHold[] }>(
    id && tab === 'holds' ? `/construction/projects/${id}/work-holds` : null,
  );
  const variations = useResource<{ data: Variation[] }>(
    id && tab === 'variations' ? `/construction/projects/${id}/variations` : null,
  );
  const handover = useResource<{ data: Handover | null }>(
    id && tab === 'handover' ? `/construction/projects/${id}/handover` : null,
  );

  const loading = project.loading;
  const error = project.error;

  if (loading) return <Loading label="Loading construction data…" />;
  if (!project.data) {
    return (
      <div>
        <ErrorBanner message={error ?? 'Project not found'} />
        <Link to="/staff/projects" className={secondaryButtonClass}>Back to projects</Link>
      </div>
    );
  }

  const data = project.data;
  const mob = mobilization.data?.data ?? null;
  const logList = siteLogs.data?.data ?? [];
  const grnList = grns.data?.data ?? [];
  const holdList = holds.data?.data ?? [];
  const variationList = variations.data?.data ?? [];
  const handoverRecord = handover.data?.data ?? null;

  const openHolds = holdList.filter(h => h.status === 'OPEN');

  async function handleInitMobilization() {
    if (!id) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/mobilization`, {});
      mobilization.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleReleaseMobilization() {
    if (!mob) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/mobilization/${mob.id}/release`, {});
      mobilization.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleAddSiteLog(d: { workSummary: string; weather: string; issues: string }) {
    if (!id) return;
    await api.post(`/construction/projects/${id}/site-logs`, { ...d, logDate: new Date().toISOString() });
    siteLogs.reload();
    setShowLogForm(false);
  }

  async function handleCreateGRN(d: { supplier: string; poNumber: string; notes: string }) {
    if (!id) return;
    await api.post(`/construction/projects/${id}/grns`, d);
    grns.reload();
    setShowGRNForm(false);
  }

  async function handleAcceptGRN(grnId: string) {
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/grns/${grnId}/accept`, {});
      grns.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleCreateWorkHold(d: { reason: string }) {
    if (!id) return;
    await api.post(`/construction/projects/${id}/work-holds`, d);
    holds.reload();
    setShowHoldForm(false);
  }

  async function handleLiftHold(holdId: string, d: { clearanceNotes: string }) {
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/work-holds/${holdId}/lift`, d);
      holds.reload();
      setLiftingHoldId(null);
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleCreateVariation(d: { title: string; description: string; value: number | undefined }) {
    if (!id) return;
    await api.post(`/construction/projects/${id}/variations`, d);
    variations.reload();
    setShowVariationForm(false);
  }

  async function handleApproveVariation(variationId: string) {
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/variations/${variationId}/approve`, {});
      variations.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleHandover() {
    if (!id) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/handover`, { checklist: { items: [] }, snags: [] });
      handover.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleAcceptHandover() {
    if (!id) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/handover/accept`, {});
      handover.reload();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'site-logs', label: `Site Logs (${logList.length})` },
    { key: 'grns', label: `GRNs (${grnList.length})` },
    { key: 'holds', label: openHolds.length > 0 ? `Holds ⚠ (${holdList.length})` : `Holds (${holdList.length})` },
    { key: 'variations', label: `Variations (${variationList.length})` },
    { key: 'handover', label: 'Handover' },
  ];

  const tabClass = (key: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      tab === key
        ? 'border-brand-700 text-brand-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div data-testid="construction-page">
      <PageHeader
        title={`${data.reference} — Construction`}
        subtitle="Module 6: Site management & handover"
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to={`/staff/projects/${id}/contracts`} className={secondaryButtonClass}>← Contracts</Link>
            <Link to={`/staff/projects/${id}`} className={secondaryButtonClass}>Project Overview</Link>
          </>
        }
      />

      <ErrorBanner message={error ?? submitError} />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Site Logs" value={logList.length} />
        <StatCard label="Mobilization" value={mob ? humanize(mob.status) : 'Not Started'} tone={mob?.status === 'RELEASED' ? 'green' : mob ? 'amber' : 'gray'} />
        <StatCard label="Open Holds" value={openHolds.length} tone={openHolds.length > 0 ? 'red' : 'green'} />
        <StatCard label="Variations" value={variationList.length} />
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} className={tabClass(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </nav>
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Mobilization */}
          <Card>
            <SectionTitle>Mobilization</SectionTitle>
            {mobilization.loading ? <Loading label="Loading…" /> : mob ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge tone={statusTone(mob.status)}>{humanize(mob.status)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm text-gray-900">{formatDateTime(mob.createdAt)}</span>
                </div>
                {mob.releasedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Released</span>
                    <span className="text-sm text-gray-900">{formatDateTime(mob.releasedAt)}</span>
                  </div>
                )}
                {mob.status === 'PENDING' && (
                  <button className={buttonClass} onClick={handleReleaseMobilization} disabled={submitting}>
                    Release Mobilization
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <EmptyState title="Mobilization not started" hint="Initialize mobilization to begin the construction phase." />
                <button className={buttonClass} onClick={handleInitMobilization} disabled={submitting}>
                  {submitting ? 'Working…' : 'Initialize Mobilization'}
                </button>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className={secondaryButtonClass} onClick={() => { setTab('site-logs'); setShowLogForm(true); }}>+ Site Log</button>
              <button className={secondaryButtonClass} onClick={() => { setTab('grns'); setShowGRNForm(true); }}>+ GRN</button>
              <button className={secondaryButtonClass} onClick={() => { setTab('holds'); setShowHoldForm(true); }}>+ Work Hold</button>
              <button className={secondaryButtonClass} onClick={() => { setTab('variations'); setShowVariationForm(true); }}>+ Variation</button>
              <button className={buttonClass} onClick={() => setTab('handover')}>View Handover</button>
            </div>
          </Card>

          {/* Recent logs */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Recent Site Logs</SectionTitle>
              <button className="text-xs text-blue-600 hover:underline" onClick={() => setTab('site-logs')}>View all</button>
            </div>
            {siteLogs.loading ? <Loading label="Loading…" /> : logList.length === 0 ? (
              <EmptyState title="No site logs" hint="Add daily site logs to track progress." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {logList.slice(0, 5).map(log => (
                  <li key={log.id} className="py-2">
                    <p className="text-sm font-medium text-gray-900">{log.workSummary ?? 'No summary'}</p>
                    <p className="text-xs text-gray-500">
                      {log.logDate ? formatDateTime(log.logDate) : 'Date TBD'}
                      {log.weather ? ` · ${log.weather}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Open holds warning */}
          {openHolds.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <SectionTitle>⚠ Active Work Holds</SectionTitle>
              <ul className="space-y-2">
                {openHolds.map(h => (
                  <li key={h.id}>
                    <p className="text-sm font-medium text-red-800">{h.reason}</p>
                    <p className="text-xs text-red-600">{formatDateTime(h.createdAt)}</p>
                  </li>
                ))}
              </ul>
              <button className={secondaryButtonClass + ' mt-3'} onClick={() => setTab('holds')}>Manage Holds</button>
            </Card>
          )}
        </div>
      )}

      {/* ── Site Logs ── */}
      {tab === 'site-logs' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Site Logs</SectionTitle>
            <button className={buttonClass} onClick={() => setShowLogForm(v => !v)}>
              {showLogForm ? 'Cancel' : '+ Add Log'}
            </button>
          </div>
          {showLogForm && (
            <div className="mb-4">
              <SiteLogForm onSubmit={handleAddSiteLog} onCancel={() => setShowLogForm(false)} />
            </div>
          )}
          {siteLogs.loading ? <Loading label="Loading site logs…" /> : logList.length === 0 ? (
            <EmptyState title="No site logs" hint="Record daily site activities, weather, and worker attendance." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {logList.map(log => (
                <li key={log.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.logDate ? formatDateTime(log.logDate) : 'Date TBD'}
                        {log.weather ? ` — ${log.weather}` : ''}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{log.workSummary ?? 'No summary provided'}</p>
                      {log.issues && <p className="mt-1 text-xs text-amber-600">Issues: {log.issues}</p>}
                      <p className="text-xs text-gray-400">
                        Logged by {log.loggedBy?.name ?? 'Unknown'} · {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── GRNs ── */}
      {tab === 'grns' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Goods Received Notes</SectionTitle>
            <button className={buttonClass} onClick={() => setShowGRNForm(v => !v)}>
              {showGRNForm ? 'Cancel' : '+ New GRN'}
            </button>
          </div>
          {showGRNForm && (
            <div className="mb-4">
              <GRNForm onSubmit={handleCreateGRN} onCancel={() => setShowGRNForm(false)} />
            </div>
          )}
          {grns.loading ? <Loading label="Loading GRNs…" /> : grnList.length === 0 ? (
            <EmptyState title="No GRNs recorded" hint="Record each delivery from suppliers with a GRN." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {grnList.map(grn => (
                <li key={grn.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{grn.supplier ?? 'Unknown supplier'}</p>
                    <p className="text-xs text-gray-500">
                      {(grn as any).grnNumber ? `${(grn as any).grnNumber} · ` : ''}
                      {grn.poNumber ? `PO: ${grn.poNumber} · ` : ''}
                      {formatDateTime(grn.createdAt)}
                    </p>
                    {grn.notes && <p className="mt-1 text-xs text-gray-400">{grn.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(grn.status)}>{humanize(grn.status)}</Badge>
                    {grn.status === 'PENDING' && (
                      <button className={secondaryButtonClass} onClick={() => handleAcceptGRN(grn.id)} disabled={submitting}>
                        Accept
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Work Holds ── */}
      {tab === 'holds' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Work Holds</SectionTitle>
            <button className={buttonClass} onClick={() => setShowHoldForm(v => !v)}>
              {showHoldForm ? 'Cancel' : '+ Issue Hold'}
            </button>
          </div>
          {showHoldForm && (
            <div className="mb-4">
              <WorkHoldForm onSubmit={handleCreateWorkHold} onCancel={() => setShowHoldForm(false)} />
            </div>
          )}
          <ErrorBanner message={submitError} />
          {holds.loading ? <Loading label="Loading work holds…" /> : holdList.length === 0 ? (
            <EmptyState title="No work holds" hint="Work holds pause construction. Add a hold with a reason; lift when cleared." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {holdList.map(hold => (
                <li key={hold.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{hold.reason}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(hold.createdAt)}</p>
                      {hold.clearanceNotes && (
                        <p className="mt-1 rounded bg-green-50 p-2 text-xs text-green-700">
                          Clearance: {hold.clearanceNotes}
                          {hold.liftedAt ? ` — Lifted ${formatDateTime(hold.liftedAt)}` : ''}
                        </p>
                      )}
                      {liftingHoldId === hold.id && (
                        <LiftHoldForm
                          onSubmit={d => handleLiftHold(hold.id, d)}
                          onCancel={() => setLiftingHoldId(null)}
                        />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={statusTone(hold.status)}>{humanize(hold.status)}</Badge>
                      {hold.status === 'OPEN' && liftingHoldId !== hold.id && (
                        <button className={secondaryButtonClass} onClick={() => setLiftingHoldId(hold.id)}>
                          Lift Hold
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Variations ── */}
      {tab === 'variations' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Variations</SectionTitle>
            <button className={buttonClass} onClick={() => setShowVariationForm(v => !v)}>
              {showVariationForm ? 'Cancel' : '+ New Variation'}
            </button>
          </div>
          {showVariationForm && (
            <div className="mb-4">
              <VariationForm onSubmit={handleCreateVariation} onCancel={() => setShowVariationForm(false)} />
            </div>
          )}
          <ErrorBanner message={submitError} />
          {variations.loading ? <Loading label="Loading variations…" /> : variationList.length === 0 ? (
            <EmptyState title="No variations" hint="Scope changes that affect cost or timeline. Create a variation and approve after client sign-off." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {variationList.map(v => (
                <li key={v.id} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{v.title}</p>
                      {(v as any).variationNo && (
                        <span className="text-xs text-gray-400">{(v as any).variationNo}</span>
                      )}
                    </div>
                    {v.description && <p className="mt-1 text-xs text-gray-500">{v.description}</p>}
                    <p className="text-xs text-gray-400">
                      {v.value != null ? `KES ${formatKes(v.value)} · ` : ''}
                      {formatDateTime(v.createdAt)}
                    </p>
                    {v.approvedAt && (
                      <p className="mt-1 text-xs text-green-600">Approved {formatDateTime(v.approvedAt)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone={statusTone(v.status)}>{humanize(v.status)}</Badge>
                    {v.status === 'SUBMITTED' && (
                      <button className={buttonClass} onClick={() => handleApproveVariation(v.id)} disabled={submitting}>
                        Approve
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── Handover ── */}
      {tab === 'handover' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Project Handover</SectionTitle>
            {!handoverRecord && (
              <button className={buttonClass} onClick={handleHandover} disabled={submitting}>
                {submitting ? 'Working…' : 'Initiate Handover'}
              </button>
            )}
          </div>
          <ErrorBanner message={submitError} />
          {handover.loading ? <Loading label="Loading handover…" /> : handoverRecord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge tone={(handoverRecord as any).completed ? 'green' : 'amber'}>
                  {(handoverRecord as any).completed ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{formatDateTime(handoverRecord.createdAt)}</span>
              </div>
              {handoverRecord.acceptedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Accepted by client</span>
                  <span className="text-sm text-green-700">{formatDateTime(handoverRecord.acceptedAt)}</span>
                </div>
              )}
              {!(handoverRecord as any).completed && (
                <div className="flex gap-2 pt-2">
                  <button className={buttonClass} onClick={handleAcceptHandover} disabled={submitting}>
                    {submitting ? 'Working…' : 'Accept Handover'}
                  </button>
                  <button className={secondaryButtonClass} onClick={handleHandover} disabled={submitting}>
                    Update Checklist
                  </button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Handover not initiated"
              hint="Initiate the handover process once all snags are resolved and the client has accepted."
            />
          )}
        </Card>
      )}
    </div>
  );
}

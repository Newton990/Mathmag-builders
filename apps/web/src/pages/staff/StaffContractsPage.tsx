// src/pages/staff/StaffContractsPage.tsx
// Module 5 — Contracts & Service Engagements for a project.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type { ProjectDetail, ServiceEngagement, Contract } from '../../lib/types';
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
import { formatDateTime, formatKes, humanize } from '../../lib/format';

const ENGAGEMENT_TYPES = [
  'DESIGN_ONLY',
  'PRINTING_ONLY',
  'APPROVALS_ONLY',
  'TECHNICAL_INSPECTION',
  'LABOUR_ONLY',
  'FULL_CONSTRUCTION',
] as const;

type Tab = 'engagements' | 'contracts';

// ── Inline forms ─────────────────────────────────────────────────────────────

function NewEngagementForm({ onSubmit, onCancel }: {
  onSubmit: (type: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<string>('FULL_CONSTRUCTION');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true); setErr(null);
    try { await onSubmit(type, description); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Engagement type">
        <select className={inputClass} value={type} onChange={e => setType(e.target.value)}>
          {ENGAGEMENT_TYPES.map(t => (
            <option key={t} value={t}>{humanize(t)}</option>
          ))}
        </select>
      </Field>
      <Field label="Description (optional)">
        <input className={inputClass} value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Scope notes…" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create Engagement'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NewContractForm({ engagementId, onSubmit, onCancel }: {
  engagementId?: string;
  onSubmit: (value: number | undefined, engagementId?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [valueStr, setValueStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = valueStr ? parseFloat(valueStr) : undefined;
    setSaving(true); setErr(null);
    try { await onSubmit(value, engagementId); }
    catch (e) { setErr(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <ErrorBanner message={err} />
      <Field label="Contract value (KES)">
        <input className={inputClass} type="number" value={valueStr} onChange={e => setValueStr(e.target.value)}
          placeholder="e.g. 5000000" />
      </Field>
      <div className="flex gap-2">
        <button className={buttonClass} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create Contract'}</button>
        <button className={secondaryButtonClass} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function StaffContractsPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>('contracts');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForEngagement, setContractForEngagement] = useState<string | undefined>();

  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const engagements = useResource<{ data: ServiceEngagement[] }>(
    id ? `/contracts/projects/${id}/engagements` : null,
  );
  const contracts = useResource<{ data: Contract[] }>(
    id ? `/contracts/projects/${id}/contracts` : null,
  );

  const loading = project.loading || engagements.loading || contracts.loading;
  const error = project.error ?? engagements.error ?? contracts.error;

  if (loading) return <Loading label="Loading contracts…" />;
  if (!project.data) {
    return (
      <div>
        <ErrorBanner message={error ?? 'Project not found'} />
        <Link to="/staff/projects" className={secondaryButtonClass}>Back to projects</Link>
      </div>
    );
  }

  const data = project.data;
  const engagementList = engagements.data?.data ?? [];
  const contractList = contracts.data?.data ?? [];

  const activeContracts = contractList.filter(c => c.status === 'EXECUTED' || c.status === 'SENT');
  const totalContractValue = contractList.reduce((sum, c) => sum + (c.value ?? 0), 0);

  async function handleCreateEngagement(type: string, description: string) {
    if (!id) return;
    await api.post(`/contracts/projects/${id}/engagements`, { type, description });
    await engagements.reload?.();
    setShowEngagementForm(false);
  }

  async function handleCreateContract(value: number | undefined, engagementId?: string) {
    if (!id) return;
    await api.post(`/contracts/projects/${id}/contracts`, { engagementId, value, currency: 'KES' });
    await contracts.reload?.();
    setShowContractForm(false);
    setContractForEngagement(undefined);
  }

  async function handleSendContract(contractId: string) {
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/contracts/contracts/${contractId}/send`, {});
      await contracts.reload?.();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleExecuteContract(contractId: string) {
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/contracts/contracts/${contractId}/execute`, {});
      await contracts.reload?.();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  async function handleTerminateContract(contractId: string) {
    if (!window.confirm('Are you sure you want to terminate this contract?')) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await api.post(`/contracts/contracts/${contractId}/terminate`, {});
      await contracts.reload?.();
    } catch (err) { setSubmitError(errorMessage(err)); }
    finally { setSubmitting(false); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'contracts', label: `Contracts (${contractList.length})` },
    { key: 'engagements', label: `Engagements (${engagementList.length})` },
  ];

  const tabClass = (key: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div>
      <PageHeader
        title={`${data.reference} — Contracts`}
        subtitle="Module 5: Service engagements & contracts"
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to={`/staff/projects/${id}/approvals`} className={secondaryButtonClass}>← Approvals</Link>
            <Link to={`/staff/projects/${id}/construction`} className={secondaryButtonClass}>Construction →</Link>
          </>
        }
      />

      <ErrorBanner message={error ?? submitError} />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Contracts" value={String(contractList.length)} />
        <StatCard label="Active" value={String(activeContracts.length)} tone={activeContracts.length > 0 ? 'green' : 'gray'} />
        <StatCard label="Total Value" value={formatKes(totalContractValue)} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={tabClass(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Contracts tab */}
      {tab === 'contracts' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Contracts</SectionTitle>
            <button className={buttonClass} onClick={() => { setContractForEngagement(undefined); setShowContractForm(v => !v); }} disabled={submitting}>
              {showContractForm && !contractForEngagement ? 'Cancel' : 'New Contract'}
            </button>
          </div>
          {showContractForm && !contractForEngagement && (
            <div className="mb-4">
              <NewContractForm onSubmit={handleCreateContract} onCancel={() => setShowContractForm(false)} />
            </div>
          )}
          {contractList.length === 0 ? (
            <EmptyState title="No contracts yet" hint="Create a contract linked to a service engagement." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {contractList.map(contract => (
                <li key={contract.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Contract #{contract.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {formatDateTime(contract.createdAt)}
                        {contract.sentAt ? ` · Sent ${formatDateTime(contract.sentAt)}` : ''}
                        {contract.executedAt ? ` · Executed ${formatDateTime(contract.executedAt)}` : ''}
                      </p>
                      {contract.value != null && (
                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {formatKes(contract.value)} {contract.currency ?? 'KES'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={statusTone(contract.status)}>{humanize(contract.status)}</Badge>
                      <div className="flex gap-2">
                        {contract.status === 'DRAFT' && (
                          <button className={secondaryButtonClass} onClick={() => handleSendContract(contract.id)} disabled={submitting}>Send</button>
                        )}
                        {contract.status === 'SENT' && (
                          <button className={buttonClass} onClick={() => handleExecuteContract(contract.id)} disabled={submitting}>Execute</button>
                        )}
                        {(contract.status === 'DRAFT' || contract.status === 'SENT') && (
                          <button
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
                            onClick={() => handleTerminateContract(contract.id)}
                            disabled={submitting}
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Engagements tab */}
      {tab === 'engagements' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Service Engagements</SectionTitle>
            <button className={buttonClass} onClick={() => setShowEngagementForm(v => !v)} disabled={submitting}>
              {showEngagementForm ? 'Cancel' : 'New Engagement'}
            </button>
          </div>
          {showEngagementForm && (
            <div className="mb-4">
              <NewEngagementForm onSubmit={handleCreateEngagement} onCancel={() => setShowEngagementForm(false)} />
            </div>
          )}
          {/* Contract-for-engagement form */}
          {contractForEngagement && showContractForm && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-700">New contract for engagement:</p>
              <NewContractForm
                engagementId={contractForEngagement}
                onSubmit={handleCreateContract}
                onCancel={() => { setShowContractForm(false); setContractForEngagement(undefined); }}
              />
            </div>
          )}
          {engagementList.length === 0 ? (
            <EmptyState title="No service engagements" hint="Define the scope of services before creating contracts." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {engagementList.map(engagement => (
                <li key={engagement.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{humanize(engagement.type)}</p>
                    <p className="text-xs text-gray-500">
                      {engagement.description ?? 'No description'}
                      {' · '}Created {formatDateTime(engagement.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(engagement.status)}>{humanize(engagement.status)}</Badge>
                    <button
                      className={secondaryButtonClass}
                      onClick={() => {
                        setContractForEngagement(engagement.id);
                        setShowContractForm(true);
                        setTab('contracts');
                      }}
                      disabled={submitting}
                    >
                      Create Contract
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

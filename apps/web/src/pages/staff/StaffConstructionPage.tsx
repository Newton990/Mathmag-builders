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
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';

type Tab = 'overview' | 'site-logs' | 'grns' | 'holds' | 'variations' | 'handover';

export function StaffConstructionPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const mobilization = useResource<{ data: Mobilization }>(
    id ? `/construction/projects/${id}/mobilization` : null,
  );
  const siteLogs = useResource<{ data: SiteLog[] }>(
    id ? `/construction/projects/${id}/site-logs` : null,
  );

  const loading = project.loading || siteLogs.loading;
  const error = project.error ?? siteLogs.error ?? mobilization.error;

  if (loading) return <Loading label="Loading construction data…" />;
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
  const mob = mobilization.data?.data ?? null;
  const logList = siteLogs.data?.data ?? [];

  async function handleInitMobilization() {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/mobilization`, {});
      await mobilization.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReleaseMobilization() {
    if (!mob) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/mobilization/${mob.id}/release`, {});
      await mobilization.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddSiteLog() {
    if (!id) return;
    const workSummary = window.prompt('Work summary for today:');
    if (!workSummary) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/site-logs`, {
        logDate: new Date().toISOString(),
        workSummary,
      });
      await siteLogs.reload?.();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGRN() {
    if (!id) return;
    const supplier = window.prompt('Supplier name:');
    if (!supplier) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/grns`, { supplier });
      setTab('grns');
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateWorkHold() {
    if (!id) return;
    const reason = window.prompt('Reason for work hold:');
    if (!reason) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/work-holds`, { reason });
      setTab('holds');
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateVariation() {
    if (!id) return;
    const title = window.prompt('Variation title:');
    if (!title) return;
    const valueStr = window.prompt('Variation value (KES):');
    const value = valueStr ? parseFloat(valueStr) : undefined;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/variations`, { title, value });
      setTab('variations');
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHandover() {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/construction/projects/${id}/handover`, {
        checklist: { items: [] },
        snags: [],
      });
      setTab('handover');
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'site-logs', label: `Site Logs (${logList.length})` },
    { key: 'grns', label: 'GRNs' },
    { key: 'holds', label: 'Work Holds' },
    { key: 'variations', label: 'Variations' },
    { key: 'handover', label: 'Handover' },
  ];

  return (
    <div>
      <PageHeader
        title={`${data.reference} — Construction`}
        subtitle="Module 6: Site management & handover"
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to={`/staff/projects/${id}/contracts`} className={secondaryButtonClass}>
              ← Contracts
            </Link>
            <Link to={`/staff/projects/${id}`} className={secondaryButtonClass}>
              Project Overview
            </Link>
          </>
        }
      />

      <ErrorBanner message={error ?? submitError} />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Site Logs" value={String(logList.length)} />
        <StatCard
          label="Mobilization"
          value={mob ? humanize(mob.status) : 'Not Started'}
        />
        <StatCard
          label="Stage"
          value={humanize(data.currentStage)}
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Mobilization card */}
          <Card>
            <SectionTitle>Mobilization</SectionTitle>
            {mob ? (
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
                    <span className="text-sm text-gray-900">
                      {formatDateTime(mob.releasedAt)}
                    </span>
                  </div>
                )}
                {mob.status === 'PENDING' && (
                  <button
                    className={buttonClass}
                    onClick={handleReleaseMobilization}
                    disabled={submitting}
                  >
                    Release Mobilization
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <EmptyState
                  title="Mobilization not started"
                  hint="Initialize mobilization to begin the construction phase."
                />
                <button
                  className={buttonClass}
                  onClick={handleInitMobilization}
                  disabled={submitting}
                >
                  {submitting ? 'Working…' : 'Initialize Mobilization'}
                </button>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className={secondaryButtonClass}
                onClick={handleAddSiteLog}
                disabled={submitting}
              >
                + Site Log
              </button>
              <button
                className={secondaryButtonClass}
                onClick={handleCreateGRN}
                disabled={submitting}
              >
                + GRN
              </button>
              <button
                className={secondaryButtonClass}
                onClick={handleCreateWorkHold}
                disabled={submitting}
              >
                + Work Hold
              </button>
              <button
                className={secondaryButtonClass}
                onClick={handleCreateVariation}
                disabled={submitting}
              >
                + Variation
              </button>
              <button
                className={buttonClass}
                onClick={handleHandover}
                disabled={submitting}
              >
                Initiate Handover
              </button>
            </div>
          </Card>

          {/* Recent logs */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Recent Site Logs</SectionTitle>
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setTab('site-logs')}
              >
                View all
              </button>
            </div>
            {logList.length === 0 ? (
              <EmptyState title="No site logs" hint="Add daily site logs to track progress." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {logList.slice(0, 5).map((log) => (
                  <li key={log.id} className="py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {log.workSummary ?? 'No summary'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.logDate ? formatDateTime(log.logDate) : 'Date TBD'}
                      {log.weather ? ` · ${log.weather}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Site Logs */}
      {tab === 'site-logs' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Site Logs</SectionTitle>
            <button className={buttonClass} onClick={handleAddSiteLog} disabled={submitting}>
              {submitting ? 'Working…' : 'Add Log'}
            </button>
          </div>
          {logList.length === 0 ? (
            <EmptyState
              title="No site logs"
              hint="Record daily site activities, weather, and worker attendance."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {logList.map((log) => (
                <li key={log.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.logDate ? formatDateTime(log.logDate) : 'Date TBD'}
                        {log.weather ? ` — ${log.weather}` : ''}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.workSummary ?? 'No summary provided'}
                      </p>
                      {log.issues && (
                        <p className="mt-1 text-xs text-amber-600">Issues: {log.issues}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Logged by {log.loggedBy?.name ?? 'Unknown'} · Created{' '}
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* GRNs */}
      {tab === 'grns' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Goods Received Notes</SectionTitle>
            <button className={buttonClass} onClick={handleCreateGRN} disabled={submitting}>
              {submitting ? 'Working…' : 'New GRN'}
            </button>
          </div>
          <EmptyState
            title="GRN list"
            hint="GRNs are created per delivery. Use 'New GRN' to record a delivery from a supplier."
          />
        </Card>
      )}

      {/* Work Holds */}
      {tab === 'holds' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Work Holds</SectionTitle>
            <button
              className={buttonClass}
              onClick={handleCreateWorkHold}
              disabled={submitting}
            >
              {submitting ? 'Working…' : 'Add Hold'}
            </button>
          </div>
          <EmptyState
            title="Work holds"
            hint="Work holds pause construction. Add a hold with a reason; lift when cleared."
          />
        </Card>
      )}

      {/* Variations */}
      {tab === 'variations' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Variations</SectionTitle>
            <button
              className={buttonClass}
              onClick={handleCreateVariation}
              disabled={submitting}
            >
              {submitting ? 'Working…' : 'New Variation'}
            </button>
          </div>
          <EmptyState
            title="Variations"
            hint="Scope changes that affect cost or timeline. Create a variation and approve after client sign-off."
          />
        </Card>
      )}

      {/* Handover */}
      {tab === 'handover' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Project Handover</SectionTitle>
            <button className={buttonClass} onClick={handleHandover} disabled={submitting}>
              {submitting ? 'Working…' : 'Create / Update Handover'}
            </button>
          </div>
          <EmptyState
            title="Handover checklist"
            hint="Initiate the handover process once all snags are resolved and the client has accepted."
          />
        </Card>
      )}
    </div>
  );
}

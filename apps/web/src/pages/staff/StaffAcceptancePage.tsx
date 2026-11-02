// src/pages/staff/StaffAcceptancePage.tsx
// Module 3 — Client Acceptance & Budget for a project.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useResource } from '../../lib/useResource';
import { api, errorMessage } from '../../lib/api';
import type { ProjectDetail, Proposal, PaymentMilestone, ModuleRelease } from '../../lib/types';
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
import { formatDateTime, formatKes, humanize } from '../../lib/format';

type Tab = 'proposals' | 'payments' | 'releases';

export function StaffAcceptancePage() {
  const { id } = useParams();
  const [tab, setTab] = useState<Tab>('proposals');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const project = useResource<ProjectDetail>(id ? `/projects/${id}` : null);
  const proposals = useResource<{ data: Proposal[] }>(id ? `/acceptance/projects/${id}/proposals` : null);
  const payments = useResource<{ data: PaymentMilestone[] }>(id ? `/acceptance/projects/${id}/payments` : null);
  const releases = useResource<{ data: ModuleRelease[] }>(id ? `/acceptance/projects/${id}/releases` : null);

  const refetchProposals = proposals.reload;
  const refetchPayments = payments.reload;
  const refetchReleases = releases.reload;

  const loading =
    project.loading || proposals.loading || payments.loading || releases.loading;
  const error =
    project.error ?? proposals.error ?? payments.error ?? releases.error;

  if (loading) return <Loading label="Loading acceptance data…" />;
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
  const proposalList = proposals.data?.data ?? [];
  const paymentList = payments.data?.data ?? [];
  const releaseList = releases.data?.data ?? [];

  const acceptedProposals = proposalList.filter((p) => p.status === 'CLIENT_ACCEPTED');
  const pendingPayments = paymentList.filter((p) => p.status === 'PENDING');
  const totalBudget = proposalList.reduce((sum, p) => sum + (p.totalFee ?? 0), 0);

  async function handleCreateProposal() {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/acceptance/projects/${id}/proposals/from-planning`, {});
      refetchProposals();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublishProposal(proposalId: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/acceptance/proposals/${proposalId}/publish`, {
        detailedBudgetVisible: true,
      });
      refetchProposals();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClientAccept(proposalId: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/acceptance/proposals/${proposalId}/client-acceptance`, {
        method: 'PORTAL',
        acceptanceText: 'Client accepted via portal',
      });
      refetchProposals();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyPayment(paymentId: string) {
    const ref = window.prompt('Enter transaction reference:');
    if (!ref) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/acceptance/payments/${paymentId}/verify`, {
        transactionRef: ref,
      });
      refetchPayments();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReleaseToModule4() {
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/acceptance/projects/${id}/module4/release`, {
        notes: 'Released via portal',
      });
      refetchReleases();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'proposals', label: `Proposals (${proposalList.length})` },
    { key: 'payments', label: `Payments (${paymentList.length})` },
    { key: 'releases', label: `Releases (${releaseList.length})` },
  ];

  return (
    <div>
      <PageHeader
        title={`${data.reference} — Acceptance`}
        subtitle="Module 3: Client acceptance & budget"
        actions={
          <>
            <Badge tone={statusTone(data.currentStage)}>{humanize(data.currentStage)}</Badge>
            <Link to={`/staff/projects/${id}`} className={secondaryButtonClass}>
              ← Project
            </Link>
            <Link to={`/staff/projects/${id}/approvals`} className={secondaryButtonClass}>
              Approvals →
            </Link>
          </>
        }
      />

      <ErrorBanner message={error ?? submitError} />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Proposals" value={String(proposalList.length)} />
        <StatCard label="Accepted" value={String(acceptedProposals.length)} />
        <StatCard label="Total Budget" value={formatKes(totalBudget)} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
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

      {/* Proposals tab */}
      {tab === 'proposals' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Proposals</SectionTitle>
            <button
              className={buttonClass}
              onClick={handleCreateProposal}
              disabled={submitting}
            >
              {submitting ? 'Working…' : 'Create from Planning'}
            </button>
          </div>
          {proposalList.length === 0 ? (
            <EmptyState
              title="No proposals yet"
              hint="Create a proposal from the completed planning package."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {proposalList.map((proposal) => (
                <li key={proposal.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Proposal #{proposal.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {formatDateTime(proposal.createdAt)}
                        {proposal.publishedAt
                          ? ` · Published ${formatDateTime(proposal.publishedAt)}`
                          : ''}
                      </p>
                      {proposal.totalFee != null && (
                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {formatKes(proposal.totalFee)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={statusTone(proposal.status)}>
                        {humanize(proposal.status)}
                      </Badge>
                      {proposal.status === 'DRAFT' && (
                        <button
                          className={secondaryButtonClass}
                          onClick={() => handlePublishProposal(proposal.id)}
                          disabled={submitting}
                        >
                          Publish
                        </button>
                      )}
                      {proposal.status === 'PUBLISHED' && (
                        <button
                          className={buttonClass}
                          onClick={() => handleClientAccept(proposal.id)}
                          disabled={submitting}
                        >
                          Record Acceptance
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

      {/* Payments tab */}
      {tab === 'payments' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Payment Milestones</SectionTitle>
            {pendingPayments.length > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {pendingPayments.length} pending
              </span>
            )}
          </div>
          {paymentList.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              hint="Payment milestones are created when proposals are accepted."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {paymentList.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.milestoneDescription ?? 'Milestone'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {formatKes(payment.amountDue)}
                      {payment.amountPaid != null
                        ? ` · Paid: ${formatKes(payment.amountPaid)}`
                        : ''}
                      {payment.paidAt ? ` on ${formatDateTime(payment.paidAt)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone(payment.status)}>{humanize(payment.status)}</Badge>
                    {payment.status === 'PENDING' && (
                      <button
                        className={buttonClass}
                        onClick={() => handleVerifyPayment(payment.id)}
                        disabled={submitting}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Releases tab */}
      {tab === 'releases' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Module Releases</SectionTitle>
            <button
              className={buttonClass}
              onClick={handleReleaseToModule4}
              disabled={submitting}
            >
              {submitting ? 'Working…' : 'Release to Module 4'}
            </button>
          </div>
          {releaseList.length === 0 ? (
            <EmptyState
              title="Not yet released"
              hint="Release triggers Module 4 (Statutory Approvals) workflow."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {releaseList.map((release) => (
                <li key={release.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Release to {humanize(release.toModule)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(release.releasedAt)}
                      {release.notes ? ` · ${release.notes}` : ''}
                    </p>
                  </div>
                  <Badge tone={statusTone(release.status)}>{humanize(release.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

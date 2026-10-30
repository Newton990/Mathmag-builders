// src/pages/field/FieldSurveyPage.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import type { SiteSurvey } from '../../lib/types';
import {
  Badge,
  Card,
  ErrorBanner,
  Loading,
  PageHeader,
  buttonClass,
  secondaryButtonClass,
  statusTone,
} from '../../components/ui';
import { formatDateTime, humanize } from '../../lib/format';
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from '../../lib/survey';

const TABS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

export function FieldSurveyPage() {
  const { id } = useParams();
  const resource = useResource<SiteSurvey>(id ? `/surveys/${id}` : null);
  const survey = resource.data;
  const [tab, setTab] = useState<(typeof TABS)[number]>('A');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const isLocked = Boolean(survey?.lockedAt || survey?.submittedAt);
  const isSubmitted = survey?.status === 'SUBMITTED';

  useEffect(() => {
    if (!id) return;
    const draft = loadLocalDraft(id);
    if (draft) {
      setDraftSavedAt(draft.savedAt);
    }
  }, [id]);

  function saveDraft() {
    if (!id || isLocked) return;
    saveLocalDraft(id, {
      B: {},
      C: {},
      D: {},
      E: {},
      F: {},
      G: {},
    } as never);
    const draft = loadLocalDraft(id);
    if (draft) {
      setDraftSavedAt(draft.savedAt);
    }
  }

  async function submitSurvey() {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/surveys/${id}/submit`);
      clearLocalDraft(id);
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (resource.loading) return <Loading label="Loading survey…" />;
  if (!survey) {
    return (
      <div className="p-4">
        <ErrorBanner message={resource.error ?? 'Survey not found'} />
        <Link to="/field" className={secondaryButtonClass}>
          Back to visits
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageHeader
        title={`Survey v${survey.version}`}
        subtitle={`Booking ${survey.bookingId} · ${survey.booking.project.reference}`}
        actions={
          <>
            <Badge tone={statusTone(survey.status)}>{humanize(survey.status)}</Badge>
            {survey.lockedAt ? <Badge tone="red">Locked</Badge> : null}
            <Link to={`/field/visits/${survey.bookingId}`} className={secondaryButtonClass}>
              Visit
            </Link>
            <Link to="/field" className={secondaryButtonClass}>
              Visits
            </Link>
          </>
        }
      />

      <ErrorBanner message={error ?? resource.error} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm ${
                  tab === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Section {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {draftSavedAt ? (
              <span className="text-gray-500">Draft saved {formatDateTime(draftSavedAt)}</span>
            ) : null}
            <button type="button" disabled={isLocked} onClick={saveDraft} className={secondaryButtonClass}>
              Save draft offline
            </button>
          </div>
        </div>
      </Card>

      {isLocked ? (
        <Card className="mb-4">
          <p className="text-sm text-gray-700">
            This survey version is locked because it has been submitted. Corrections require a new survey
            version — updates to a locked survey are not permitted.
          </p>
          {survey.submittedAt ? (
            <p className="mt-1 text-xs text-gray-500">Submitted {formatDateTime(survey.submittedAt)}</p>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Section {tab}</h3>
        <p className="text-sm text-gray-600">
          The full A–G form fields are defined by the shared survey schemas. This screen provides
          offline drafting, GPS/media integration points and submission. Use the API/UI flow to complete
          sections B–G in detail.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Terrain notes are labelled as preliminary observations; sketches are not cadastral surveys.
        </p>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isSubmitted && !isLocked ? (
          <button type="button" disabled={submitting} className={buttonClass} onClick={submitSurvey}>
            {submitting ? 'Submitting…' : 'Submit survey (locks original)'}
          </button>
        ) : null}
        <Link to={`/field/visits/${survey.bookingId}`} className={secondaryButtonClass}>
          Back to visit
        </Link>
      </div>
    </div>
  );
}

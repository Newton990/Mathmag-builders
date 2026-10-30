// src/pages/staff/StaffConfirmBookingPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { useResource } from '../../lib/useResource';
import type {
  ConfirmBookingResponse,
  ConversationSummary,
  DirectoryUser,
  ItemsResponse,
  ListResponse,
} from '../../lib/types';
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '../../components/ui';
import { nairobiDateToIso, isoToNairobiDate } from '../../lib/format';

export function StaffConfirmBookingPage() {
  const navigate = useNavigate();
  const conversations = useResource<ListResponse<ConversationSummary>>('/conversations?take=100');
  const officers = useResource<ItemsResponse<DirectoryUser>>('/directory/users?role=VISITING_OFFICER');

  const [conversationId, setConversationId] = useState('');
  const [fullName, setFullName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [county, setCounty] = useState('');
  const [area, setArea] = useState('');
  const [subCounty, setSubCounty] = useState('');
  const [directions, setDirections] = useState('');
  const [projectType, setProjectType] = useState('');
  const [scheduledAt, setScheduledAt] = useState(isoToNairobiDate(new Date().toISOString()));
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [visitFeeKes, setVisitFeeKes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [idempotencyKey] = useState(
    () => `confirm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickConversation(value: string) {
    setConversationId(value);
    const conversation = conversations.data?.items.find((item) => item.id === value);
    if (!conversation) return;
    setFullName(conversation.contact.fullName);
    setPrimaryPhone(conversation.contact.primaryPhone);
    setEmail(conversation.contact.email ?? '');
    setOrganisation(conversation.contact.organisation ?? '');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        idempotencyKey,
        scheduledAt: nairobiDateToIso(scheduledAt),
        site: {
          county: county.trim(),
          area: area.trim(),
          ...(subCounty.trim() ? { subCounty: subCounty.trim() } : {}),
          ...(directions.trim() ? { directions: directions.trim() } : {}),
          ...(projectType.trim() ? { projectType: projectType.trim() } : {}),
        },
      };

      if (conversationId) body['conversationId'] = conversationId;
      else {
        body['contact'] = {
          fullName: fullName.trim(),
          primaryPhone: primaryPhone.trim(),
          ...(organisation.trim() ? { organisation: organisation.trim() } : {}),
          ...(email.trim() ? { email: email.trim() } : {}),
        };
      }
      if (assignedOfficerId) body['assignedOfficerId'] = assignedOfficerId;
      if (visitFeeKes.trim()) body['visitFeeKes'] = Number(visitFeeKes);
      if (specialInstructions.trim()) body['specialInstructions'] = specialInstructions.trim();

      const response = await api.post<ConfirmBookingResponse>('/visits/confirm', body);
      navigate(`/staff/projects/${response.project.id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Confirm agreed site visit"
        subtitle="A project is only created after an agreed visit date and time. Reschedules must never create a new project."
        actions={
          <Link to="/staff/inbox" className={secondaryButtonClass}>
            Back to inbox
          </Link>
        }
      />

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Link to enquiry (optional)</h3>
          <Field label="Conversation">
            <select
              value={conversationId}
              onChange={(event) => pickConversation(event.target.value)}
              className={inputClass}
            >
              <option value="">No linked conversation — use manual client details</option>
              {conversations.data?.items.map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversation.contact.fullName} · {conversation.contact.primaryPhone} ·{' '}
                  {conversation.status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Client details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                disabled={Boolean(conversationId)}
                className={inputClass}
              />
            </Field>
            <Field label="Primary phone (+254...)">
              <input
                value={primaryPhone}
                onChange={(event) => setPrimaryPhone(event.target.value)}
                required
                disabled={Boolean(conversationId)}
                className={inputClass}
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={Boolean(conversationId)}
                className={inputClass}
              />
            </Field>
            <Field label="Organisation (optional)">
              <input
                value={organisation}
                onChange={(event) => setOrganisation(event.target.value)}
                disabled={Boolean(conversationId)}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Site details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="County">
              <input value={county} onChange={(event) => setCounty(event.target.value)} required className={inputClass} />
            </Field>
            <Field label="Area / locality">
              <input value={area} onChange={(event) => setArea(event.target.value)} required className={inputClass} />
            </Field>
            <Field label="Sub-county (optional)">
              <input value={subCounty} onChange={(event) => setSubCounty(event.target.value)} className={inputClass} />
            </Field>
            <Field label="Project type (optional)">
              <input value={projectType} onChange={(event) => setProjectType(event.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Directions (optional)">
              <textarea
                value={directions}
                onChange={(event) => setDirections(event.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Visit booking</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Agreed date (Africa/Nairobi)">
              <input
                type="date"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Assign visiting officer (optional)">
              <select
                value={assignedOfficerId}
                onChange={(event) => setAssignedOfficerId(event.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {officers.data?.items.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name} ({officer.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visit fee (KES, optional)">
              <input
                type="number"
                min="0"
                value={visitFeeKes}
                onChange={(event) => setVisitFeeKes(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Special instructions (optional)">
              <textarea
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-gray-500">Idempotency key: {idempotencyKey}</p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? 'Creating project…' : 'Confirm visit and create project'}
          </button>
          <Link to="/staff/inbox" className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

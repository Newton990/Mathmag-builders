// ================================================================================
// MBMS — Exercise Every Business Action
// Calls every major API action against a locally running server.
// Prereqs: server running on http://localhost:3001, DB seeded.
// Scope: local folder only. Does NOT touch GitHub.
// Usage: node scripts/exercise-actions.mjs
// ================================================================================

const BASE = process.env.MBMS_BASE_URL || 'http://localhost:3001';
const results = [];

function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(method, path, body, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { data = await res.text(); }
  return { ok: res.ok, status: res.status, data };
}

// ── helpers ───────────────────────────────────────────────────────────────────
let token = null;

async function tryAuth() {
  // Try a seeded client login; fall back gracefully if no seed user exists.
  const r = await req('POST', '/api/auth/login', {
    email: 'client@example.com',
    password: 'Password123!',
  });
  if (r.ok && r.data.accessToken) {
    token = r.data.accessToken;
    log('auth login (seeded client)', true, 'got access token');
    return true;
  }
  log('auth login (seeded client)', false, `status ${r.status} — will proceed unauthenticated where possible`);
  return false;
}

async function run() {
  console.log(`\nExercising MBMS actions against ${BASE}\n`);

  // ── 1. Health ─────────────────────────────────────────────────────────────
  const h = await req('GET', '/api/health');
  log('health check', h.ok, h.ok ? `status ${h.status}` : `status ${h.status}`);

  // ── 2. Auth ───────────────────────────────────────────────────────────────
  await tryAuth();

  // ── 3. Conversations (inbox) ──────────────────────────────────────────────
  const convList = await req('GET', '/api/conversations', null, token);
  log('conversations list', convList.ok, convList.ok ? `count ${convList.data?.data?.length ?? 0}` : `status ${convList.status}`);

  const convCreate = await req('POST', '/api/conversations', {
    channel: 'MANUAL',
    subject: 'Exercise conversation',
    initialMessage: 'Hello from action exerciser',
  }, token);
  log('conversation create', convCreate.ok, convCreate.ok ? `id ${convCreate.data?.data?.id}` : `status ${convCreate.status}`);
  const convId = convCreate.ok ? convCreate.data?.data?.id : null;

  if (convId) {
    const convGet = await req('GET', `/api/conversations/${convId}`, null, token);
    log('conversation get', convGet.ok, convGet.ok ? 'retrieved' : `status ${convGet.status}`);

    const convMsg = await req('POST', `/api/conversations/${convId}/messages`, {
      content: 'Exercise message',
      isNote: true,
    }, token);
    log('conversation add message', convMsg.ok, convMsg.ok ? 'added' : `status ${convMsg.status}`);
  }

  // ── 4. Bookings / visits ──────────────────────────────────────────────────
  const bookingList = await req('GET', '/api/bookings', null, token);
  log('bookings list', bookingList.ok, bookingList.ok ? `count ${bookingList.data?.data?.length ?? 0}` : `status ${bookingList.status}`);

  // Try confirm a booking (needs valid payload; may fail without seeded contact)
  const bookingConfirm = await req('POST', '/api/bookings', {
    idempotencyKey: `exercise-${Date.now()}`,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    site: { county: 'Nairobi', area: 'Westlands', subCounty: 'Westlands', directions: 'Near mall', projectType: 'Residential', description: 'Exercise site' },
    contact: { fullName: 'Exercise Client', primaryPhone: '+254700000000', email: 'exercise@example.com' },
    visitFeeKes: 5000,
  }, token);
  log('booking confirm', bookingConfirm.ok, bookingConfirm.ok ? `ref ${bookingConfirm.data?.data?.project?.reference}` : `status ${bookingConfirm.status}`);
  const bookingId = bookingConfirm.ok ? bookingConfirm.data?.data?.booking?.id : null;

  if (bookingId) {
    const bookingGet = await req('GET', `/api/bookings/${bookingId}`, null, token);
    log('booking get', bookingGet.ok, bookingGet.ok ? 'retrieved' : `status ${bookingGet.status}`);

    const bookingResched = await req('PATCH', `/api/bookings/${bookingId}/reschedule`, {
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      reason: 'Exercise reschedule',
    }, token);
    log('booking reschedule', bookingResched.ok, bookingResched.ok ? 'rescheduled' : `status ${bookingResched.status}`);

    const bookingCheckIn = await req('POST', `/api/bookings/${bookingId}/check-in`, {
      gps: { latitude: -1.2921, longitude: 36.8219, accuracy: 5 },
    }, token);
    log('booking check-in', bookingCheckIn.ok, bookingCheckIn.ok ? 'checked in' : `status ${bookingCheckIn.status}`);

    const bookingCheckOut = await req('POST', `/api/bookings/${bookingId}/check-out`, {
      gps: { latitude: -1.2921, longitude: 36.8219, accuracy: 5 },
    }, token);
    log('booking check-out', bookingCheckOut.ok, bookingCheckOut.ok ? 'checked out' : `status ${bookingCheckOut.status}`);

    const bookingFee = await req('POST', `/api/bookings/${bookingId}/fee`, {
      paymentStatus: 'PAID',
    }, token);
    log('booking record fee', bookingFee.ok, bookingFee.ok ? 'fee recorded' : `status ${bookingFee.status}`);
  }

  // ── 5. Projects ───────────────────────────────────────────────────────────
  const projList = await req('GET', '/api/projects', null, token);
  log('projects list', projList.ok, projList.ok ? `count ${projList.data?.data?.length ?? 0}` : `status ${projList.status}`);

  // ── 6. Surveys ────────────────────────────────────────────────────────────
  const surveyList = await req('GET', '/api/surveys', null, token);
  log('surveys list', surveyList.ok, surveyList.ok ? `count ${surveyList.data?.data?.length ?? 0}` : `status ${surveyList.status}`);

  // ── 7. Reports ────────────────────────────────────────────────────────────
  const reportList = await req('GET', '/api/reports', null, token);
  log('reports list', reportList.ok, reportList.ok ? `count ${reportList.data?.data?.length ?? 0}` : `status ${reportList.status}`);

  // ── 8. Publications ───────────────────────────────────────────────────────
  const pubList = await req('GET', '/api/publications', null, token);
  log('publications list', pubList.ok, pubList.ok ? `count ${pubList.data?.data?.length ?? 0}` : `status ${pubList.status}`);

  // ── 9. Portal ─────────────────────────────────────────────────────────────
  const portalList = await req('GET', '/api/portal', null, token);
  log('portal list', portalList.ok, portalList.ok ? `count ${portalList.data?.data?.length ?? 0}` : `status ${portalList.status}`);

  // ── 10. Media ─────────────────────────────────────────────────────────────
  const mediaList = await req('GET', '/api/media', null, token);
  log('media list', mediaList.ok, mediaList.ok ? `count ${mediaList.data?.data?.length ?? 0}` : `status ${mediaList.status}`);

  // ── 11. Directory ─────────────────────────────────────────────────────────
  const dirList = await req('GET', '/api/directory', null, token);
  log('directory list', dirList.ok, dirList.ok ? `count ${dirList.data?.data?.length ?? 0}` : `status ${dirList.status}`);

  // ── 12. Planning ──────────────────────────────────────────────────────────
  const planList = await req('GET', '/api/planning', null, token);
  log('planning list', planList.ok, planList.ok ? `count ${planList.data?.data?.length ?? 0}` : `status ${planList.status}`);

  // ── 13. Acceptance ────────────────────────────────────────────────────────
  const acceptList = await req('GET', '/api/acceptance', null, token);
  log('acceptance list', acceptList.ok, acceptList.ok ? `count ${acceptList.data?.data?.length ?? 0}` : `status ${acceptList.status}`);

  // ── 14. Approvals ─────────────────────────────────────────────────────────
  const apprList = await req('GET', '/api/approvals', null, token);
  log('approvals list', apprList.ok, apprList.ok ? `count ${apprList.data?.data?.length ?? 0}` : `status ${apprList.status}`);

  // ── 15. Contracts ─────────────────────────────────────────────────────────
  const contractList = await req('GET', '/api/contracts', null, token);
  log('contracts list', contractList.ok, contractList.ok ? `count ${contractList.data?.data?.length ?? 0}` : `status ${contractList.status}`);

  // ── 16. Construction ──────────────────────────────────────────────────────
  const constrList = await req('GET', '/api/construction', null, token);
  log('construction list', constrList.ok, constrList.ok ? `count ${constrList.data?.data?.length ?? 0}` : `status ${constrList.status}`);

  // ── 17. Governance ────────────────────────────────────────────────────────
  const govList = await req('GET', '/api/governance', null, token);
  log('governance list', govList.ok, govList.ok ? `count ${govList.data?.data?.length ?? 0}` : `status ${govList.status}`);

  // ── 18. Suppliers ─────────────────────────────────────────────────────────
  const suppList = await req('GET', '/api/suppliers', null, token);
  log('suppliers list', suppList.ok, suppList.ok ? `count ${suppList.data?.data?.length ?? 0}` : `status ${suppList.status}`);

  // ── 19. Invoices ──────────────────────────────────────────────────────────
  const invList = await req('GET', '/api/invoices', null, token);
  log('invoices list', invList.ok, invList.ok ? `count ${invList.data?.data?.length ?? 0}` : `status ${invList.status}`);

  // ── 20. Worker reports ────────────────────────────────────────────────────
  const wrList = await req('GET', '/api/worker-reports', null, token);
  log('worker-reports list', wrList.ok, wrList.ok ? `count ${wrList.data?.data?.length ?? 0}` : `status ${wrList.status}`);

  // ── 21. Safety ────────────────────────────────────────────────────────────
  const safetyList = await req('GET', '/api/safety', null, token);
  log('safety list', safetyList.ok, safetyList.ok ? `count ${safetyList.data?.data?.length ?? 0}` : `status ${safetyList.status}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed out of ${results.length} actions ===\n`);
  if (failed > 0) {
    console.log('Failed actions:');
    results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.name} (status ${r.detail})`));
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Exerciser crashed:', err);
  process.exit(1);
});

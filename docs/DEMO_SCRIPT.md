# MBMS Demo Script — Mathmag Builders Management System

**Audience:** Client stakeholders, internal reviewers  
**Mode:** Demo mode (no backend required — append `?demo=true` to any URL, or visit the hosted demo)  
**Duration:** ~30–40 minutes (full tour) · ~12 minutes (executive summary)

---

## Before you start

1. Open the app in your browser. Demo mode activates automatically — you are
   logged in as **Demo Admin (Lead Architect)** with no sign-in required.
2. All data is simulated. No real database writes occur.
3. The URL bar always shows the full route — share any URL to demonstrate deep
   linking.

---

## 1. Login page (1 min)

Navigate to `/login`.

- Point out the branded sign-in form (email + password).
- Mention MFA support (second-factor code screen appears after first factor in
  production).
- In production: JWT access token (httpOnly cookie) + 1-hour expiry, refresh
  token rotation, argon2 hashing. No PII in logs.

> **Business rule:** Every role gets redirected to its home screen after login —
> staff to `/staff`, visiting officers to `/field`, clients to `/portal`.

---

## 2. Staff dashboard — Module 1 overview (3 min)

Navigate to `/staff`.

Point out the four stat cards:
| Card | What it counts |
|------|----------------|
| Open enquiries | Conversations not yet booked or closed |
| Upcoming visits | Agreed site visits in the future |
| Reports in review | Waiting for Lead Architect sign-off |
| Ready to publish | Approved + generated, pending publication |

Scroll down to show the two-column card grid:
- **Enquiries needing action** — links directly into individual conversations.
- **Agreed site visits** — project reference + contact + scheduled date.
- **Reports in review** / **Approved reports** — one-click navigation to report detail.

---

## 3. Communications inbox — Module 1 (3 min)

Navigate to `/staff/inbox`.

- Filter by channel (WhatsApp, email, walk-in, phone, etc.).
- Click any conversation to open the **conversation detail** page (`/staff/inbox/:id`).
  - Full message thread (staff notes vs client messages visually distinguished).
  - Agree a site visit: creates a booking and links the conversation to a project.
  - Confirm booking button: transitions enquiry → confirmed project.

> **Business rule:** An enquiry is **not** a project. A project is created only
> when a booking is confirmed (Module 1 Step 4).

---

## 4. Projects list (1 min)

Navigate to `/staff/projects`.

- Filter by stage dropdown (VISIT_BOOKED → STAGE_1_COMPLETE).
- Free-text search by reference or client name.
- Each row links to the project detail page.

---

## 5. Project detail page (2 min)

Navigate to any project (e.g. `/staff/projects/demo-project-001`).

- Reference number, client, site location, current stage badge.
- One-click links to each module tab (Planning, Acceptance, Approvals, Contracts,
  Construction).
- Survey and report history panel.

---

## 6. Module 2 — Technical Design Planning (5 min)

Navigate to `/staff/projects/demo-project-001/planning`.

### Design pipeline

- Six discipline columns: **2D Arch → 3D Arch → Structural → MEP → Electrical → QS**.
- Each column shows package status and task count.
- "Initialise design pipeline" button creates all six design packages atomically.

### Design Tasks tab

- Create a new task: discipline, title, deadline.
- Task lifecycle: `DRAFT → ASSIGNED → IN_PROGRESS → SUBMITTED_FOR_REVIEW →
  TECHNICALLY_APPROVED → RELEASED`.
- **Submit for review** button on in-progress tasks.
- **Review** button on submitted tasks → approve or return with comments.

### Client Approvals tab

- Record 2D or 3D client approval with evidence notes.
- Stat cards at the top show whether 2D/3D approvals are obtained.

> **Business rule:** 3D work cannot begin without 2D client approval.

### Coordination Issues tab

- Log cross-discipline clashes with severity (LOW → CRITICAL).
- Open issues counter shown in stat cards.

### Cost Estimates tab

- Summary and detailed budget variants with line-item tables.
- Estimate status: DRAFT → IN_REVIEW → APPROVED.

### Design Changes tab

- Minor or major scope changes with fee and time impact.
- Decision (approve/reject) recorded with timestamps.

---

## 7. Module 3 — Client Acceptance & Budget (3 min)

Navigate to `/staff/projects/demo-project-001/acceptance`.

### Proposals tab

- Generate a fee proposal from the planning cost estimate.
- Publish to client (makes it visible in the client portal).
- Record client acceptance (portal, signed form, or meeting).

### Payment Milestones tab

- Milestones are created automatically when a proposal is accepted.
- Verify individual payments: M-Pesa / bank reference recorded.

### Releases tab

- Release project to Module 4 (Statutory Approvals) once budget is accepted and
  first milestone paid.

> **Business rule:** One booking → exactly one project → one accepted proposal
> before proceeding to approvals.

---

## 8. Module 4 — Statutory Approvals (3 min)

Navigate to `/staff/projects/demo-project-001/approvals`.

- Left panel: list of approval cases (each case tracks a submission batch).
- Right panel: permits and print submissions for the selected case.

### Case lifecycle

`OPEN → IN_PROGRESS → SUBMITTED → CLEARED` (or `RETURNED` for resubmission)

### Permits tab (inside a case)

- Add individual permits: Building Permit, NCA Certificate, etc.
- Track `PENDING → APPLIED → ISSUED`.

### Print Submissions tab

- Track architectural drawing sets sent for council stamping.

---

## 9. Module 5 — Contracts (3 min)

Navigate to `/staff/projects/demo-project-001/contracts`.

### Contracts tab

- Contracts: `DRAFT → SENT → EXECUTED` (or `TERMINATED`).
- Send and execute buttons update status inline.
- Terminate with confirmation prompt.

### Engagements tab

- Service engagements define scope: DESIGN_ONLY, LABOUR_ONLY, FULL_CONSTRUCTION, etc.
- Create a contract directly from an engagement (contract inherits the engagement).

> **Business rule:** Every contract value is recorded in KES; total shown in
> stat card.

---

## 10. Module 6 — Construction Management (5 min)

Navigate to `/staff/projects/demo-project-001/construction`.

### Overview tab

- **Mobilization** card: initialise and release mobilization to begin on-site work.
- **Quick Actions**: shortcuts to add site log, GRN, work hold, or variation.
- **Recent Site Logs** preview and **Active Work Holds** warning (red card).

### Site Logs tab

- Daily log: work summary, weather, issues.
- Logged-by user and timestamp shown.

### GRNs tab (Goods Received Notes)

- Record supplier deliveries with PO number.
- Accept GRN to close the pending state.

### Holds tab

- Issue a work hold (pauses construction) with reason.
- Lift a hold with clearance notes.
- Open holds shown prominently in Overview with a red warning card.

### Variations tab

- Scope changes with KES value impact.
- Approve variations after client sign-off.

### Handover tab

- Initiate handover when snags are resolved.
- Accept handover to mark project construction complete.

---

## 11. Module 7 — Governance & Administration (3 min)

Navigate to `/staff/governance`.

| Tab | Purpose |
|-----|---------|
| Delegations | Delegate authority with value and risk-category limits |
| Acting Authorities | Temporary acting arrangements (activate/expire) |
| Exceptions | Policy exceptions: request → management approval |
| Protected Audits | Serious internal governance cases (open → triage → resolve) |
| Leave | Staff leave requests and approvals |
| Requisitions | Purchase requisitions: submit → approve before PO |
| Purchase Orders | POs generated from approved requisitions |

Stat cards at the top show live counts: active delegations, pending exceptions,
open audit cases, pending leave requests.

---

## 12. Reports workflow — Modules 8–10 (3 min)

Navigate to `/staff/reports`.

- Filtered list of all report versions across projects.
- Click a report to open the report detail page.
- **Lead Architect actions:** approve or return with corrections.
- **Junior Architect assignment** panel: assign with priority and due date.
- **Publication panel:** publish approved report to client portal (separate action
  from approval — deliberate separation of duties).

> **Business rule:** Approval and publication are **separate** audited actions.
> Approved reports are **not** automatically visible to clients.

---

## 13. Client portal (2 min)

Log out (`Sign out` in sidebar) and log in as a client account, or navigate
directly to `/portal` with a CLIENT-role session.

- Client sees only their own project(s).
- If a report has been published, the client can download the PDF and view
  permitted media (photos, sketches).
- No staff data or other clients' data is ever visible.

> **Business rule:** Clients see only **explicitly published** items for their
> own project. Server-side authorization enforced on every route.

---

## 14. Field officer app (1 min)

Navigate to `/field` (or use a mobile device / DevTools mobile viewport).

- Visiting officer dashboard: today's visits.
- Check in / check out with GPS capture.
- Mobile field form (sections A–G): offline-capable with PWA + IndexedDB.
- Survey submission locks the form; corrections workflow available.

---

## 15. Key non-functional highlights

| Feature | Detail |
|---------|--------|
| **Offline PWA** | Service worker + IndexedDB for field surveys with no connectivity |
| **Audit trail** | Every critical action writes to an append-only audit event log |
| **Role-based access** | Server-side RBAC on every API route — not just UI hiding |
| **Immutable versions** | Approved/published records cannot be mutated; changes create new versions |
| **Kenya-specific** | Time zone: Africa/Nairobi · Currency: KES · Phones: +254 |
| **Document generation** | DOCX (using `docx` library) + PDF (Playwright headless) |
| **Background jobs** | pg-boss (Postgres-backed) — no Redis dependency |

---

## Demo checklist (quick run-through)

- [ ] Login page visible
- [ ] Staff dashboard stat cards render (empty in demo mode — expected)
- [ ] Planning page design pipeline initialised
- [ ] Planning tasks tab: create + submit + review flow shown
- [ ] Acceptance: proposal create → publish → accept
- [ ] Approvals: new case → add permit → mark applied
- [ ] Contracts: new engagement → new contract → send → execute
- [ ] Construction: mobilize → site log → work hold → lift → variation → handover
- [ ] Governance: delegation → exception → audit triage
- [ ] Reports: approve → publish to client
- [ ] Client portal: published report visible

---

*Last updated: November 2026 · Step 13 of 14*

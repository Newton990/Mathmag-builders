// packages/shared/src/guide-content.ts
// Single source of truth for MBMS user-guide content.
// Used by StaffGuidePage and HelpTip components.

export interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: GuideSectionItem[];
}

export interface GuideSectionItem {
  id: string;
  title: string;
  body: string;
  steps?: string[];
  badges?: string[];
  tip?: string;
  warning?: string;
  fields?: FieldItem[];
  buttons?: ButtonItem[];
}

export interface FieldItem {
  label: string;
  required: boolean;
  type: string;
  description: string;
  example?: string;
}

export interface ButtonItem {
  label: string;
  action: string;
  when?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. QUICK START & LOGIN / MFA SETUP
// ──────────────────────────────────────────────────────────────────────────────
export const QUICK_START: GuideSection = {
  id: 'quick-start',
  title: 'Quick Start & Login',
  subtitle: 'Get signed in, verify MFA, and understand your session.',
  intro: 'Every user starts at the login page. Choose your portal, sign in, and verify your second factor if required.',
  sections: [
    {
      id: 'login-select-portal',
      title: 'Select your portal',
      body: 'On the login page you choose one of three portals. Each one maps to a set of roles and lands you on a different dashboard:',
      steps: [
        'Staff Portal — Lead & Junior Architects, Client Relations Officers, Management. Lands on the Staff dashboard.',
        'Field Officer App — Visiting Officers conducting site surveys and assessments. Lands on the Field dashboard.',
        'Client Portal — Clients tracking their construction project progress. Lands on the Client Portal.',
      ],
    },
    {
      id: 'login-email-password',
      title: 'Sign in',
      body: 'Enter your MBMS email address and password for the selected portal, then click **Sign in**.',
      steps: [
        'Select your portal.',
        'Enter your email address.',
        'Enter your password.',
        'Click **Sign in**.',
      ],
      badges: ['Email address', 'Password', 'Sign in'],
    },
    {
      id: 'mfa-verify',
      title: 'MFA verification',
      body: 'If MFA is enabled for your account, you will be asked for a 6-digit authenticator code. Enter the code and click **Verify and continue**.',
      steps: [
        'Enter the 6-digit code from your authenticator app.',
        'Click **Verify and continue**.',
        'If you do not have a code, click **Back to sign in** to return to the password step.',
      ],
      badges: ['Authentication code', 'Verify and continue'],
      tip: 'MFA is never bypassed by the portal. If you lose access to your authenticator app, contact management.',
    },
    {
      id: 'session-refresh',
      title: 'Session refresh',
      body: 'Access tokens expire after 15 minutes. The app automatically attempts to refresh your access token using the refresh token. If refresh fails, you will be redirected to the login page.',
      badges: ['Access token', 'Refresh token', 'Session expiry: 15 min'],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. STAFF ROLES & PERMISSIONS
// ──────────────────────────────────────────────────────────────────────────────
export const ROLES_PERMISSIONS: GuideSection = {
  id: 'roles-permissions',
  title: 'Staff Roles & Permissions',
  subtitle: 'What each role can see, create, verify, approve, and publish.',
  intro: 'MBMS enforces role-based access control on the server. The table below shows what each role can do.',
  sections: [
    {
      id: 'role-lead-architect',
      title: 'Lead Architect',
      body: 'Full oversight of reports, approvals, contracts, construction, and governance. Can review and approve reports, publish to clients, execute contracts, lift work holds and safety holds, and verify worker reports.',
      badges: ['LEAD_ARCHITECT'],
      steps: [
        'Create and review report versions.',
        'Approve or return reports.',
        'Publish approved report versions to clients.',
        'Execute contracts.',
        'Lift work holds and safety holds.',
        'Verify worker reports.',
        'Create and manage delegations.',
      ],
    },
    {
      id: 'role-client-relations-officer',
      title: 'Client Relations Officer',
      body: 'Owns the enquiry-to-booking flow. Creates bookings, reschedules visits, checks officers in/out, records visit fees, and creates acceptance records.',
      badges: ['CLIENT_RELATIONS_OFFICER'],
      steps: [
        'Create bookings for clients.',
        'Reschedule bookings.',
        'Check officers in and out of site visits.',
        'Record visit fees (payment status).',
        'Create acceptance records.',
      ],
    },
    {
      id: 'role-visiting-officer',
      title: 'Visiting Officer',
      body: 'Conducts site surveys and submits reports. Can check in/out of visits and submit survey data.',
      badges: ['VISITING_OFFICER'],
      steps: [
        'Check in to site visits.',
        'Capture and submit site surveys.',
        'Check out of site visits.',
      ],
    },
    {
      id: 'role-junior-architect',
      title: 'Junior Architect',
      body: 'Assigned to review design tasks and reports. Can review submissions and provide corrections.',
      badges: ['JUNIOR_ARCHITECT'],
      steps: [
        'Review design tasks.',
        'Review report versions.',
      ],
    },
    {
      id: 'role-admin-management',
      title: 'Admin Management',
      body: 'Broad administrative authority. Can create approval cases, execute contracts, manage delegations, and access governance functions.',
      badges: ['ADMIN_MANAGEMENT'],
      steps: [
        'Create approval cases.',
        'Execute contracts.',
        'Create and manage delegations.',
        'Access governance functions.',
      ],
    },
    {
      id: 'role-client',
      title: 'Client',
      body: 'Read-only access to published project content. Clients see only explicitly published items for their own projects.',
      badges: ['CLIENT'],
      steps: [
        'View published project information.',
        'View published reports.',
        'Track project progress.',
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. STEP 1 — CLIENT DATA & BOOKINGS
// ──────────────────────────────────────────────────────────────────────────────
export const BOOKINGS: GuideSection = {
  id: 'bookings',
  title: 'Bookings & Site Visits',
  subtitle: 'Module 1 — Enquiry to project flow',
  intro: 'A booking confirms a site visit and creates one project. An enquiry is not a project; one confirmed booking produces one project.',
  sections: [
    {
      id: 'bookings-create',
      title: 'Create a booking',
      body: 'Go to **Staff → Projects → Bookings** (or the bookings section) and fill in the booking form.',
      fields: [
        { label: 'Idempotency Key', required: true, type: 'text', description: 'A stable key (min 8 chars) that prevents duplicate bookings if you submit twice.', example: 'site-visit-2026-11-25-001' },
        { label: 'Scheduled At', required: true, type: 'datetime', description: 'The agreed site-visit date. Cannot be in the past.' },
        { label: 'Site — County', required: false, type: 'text', description: 'County where the site is located.', example: 'Nairobi' },
        { label: 'Site — Sub-County', required: false, type: 'text', description: 'Sub-county within the county.', example: 'Westlands' },
        { label: 'Site — Area', required: false, type: 'text', description: 'Specific area within the sub-county.', example: 'Karura' },
        { label: 'Site — Directions', required: false, type: 'text', description: 'Directions to the site.' },
        { label: 'Site — Project Type', required: false, type: 'text', description: 'Type of project (e.g., Residential Villa).' },
        { label: 'Site — Description', required: false, type: 'textarea', description: 'Description of the site.' },
        { label: 'Contact ID', required: false, type: 'text', description: 'ID of the contact associated with this booking.' },
        { label: 'Visit Fee (KES)', required: false, type: 'number', description: 'The site visit fee in Kenyan shillings.', example: '18000' },
        { label: 'Special Instructions', required: false, type: 'textarea', description: 'Any special instructions for the visit.' },
      ],
      buttons: [
        { label: 'Create Booking', action: 'Creates the project and booking. Returns the project reference (e.g., MB-2026-001) and booking ID.' },
      ],
    },
    {
      id: 'bookings-idempotency',
      title: 'Idempotency (no duplicates)',
      body: 'Each booking requires an **Idempotency Key**. If you submit the same key twice, the system returns “Booking already exists” instead of creating a duplicate.',
      badges: ['Idempotency key'],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. STEP 2 — CLIENT ACCEPTANCE & VERIFICATION
// ──────────────────────────────────────────────────────────────────────────────
export const ACCEPTANCE: GuideSection = {
  id: 'acceptance',
  title: 'Client Acceptance',
  subtitle: 'Module 3 — Client acceptance & budget',
  intro: 'After a site visit and report, the client must accept the work. Acceptance records document the client’s agreement.',
  sections: [
    {
      id: 'acceptance-create',
      title: 'Create an acceptance record',
      body: 'Go to the project’s acceptance page and create a new acceptance record.',
      fields: [
        { label: 'Method', required: true, type: 'select', description: 'How acceptance was confirmed: Portal, Signed Form, or Meeting.' },
        { label: 'Notes', required: false, type: 'textarea', description: 'Additional notes about the acceptance.' },
      ],
      buttons: [
        { label: 'Create Case / Record Acceptance', action: 'Creates an acceptance record with status PENDING.' },
      ],
    },
    {
      id: 'acceptance-verify',
      title: 'Verify acceptance',
      body: 'A reviewer (Lead Architect, Client Relations Officer, or Admin Management) verifies the acceptance. Decisions: Verified, Returned for Clarification, or Rejected.',
      badges: ['VERIFIED', 'RETURNED_FOR_CLARIFICATION', 'REJECTED'],
      buttons: [
        { label: 'Verify', action: 'Sets status to VERIFIED and records the verifier and timestamp.' },
        { label: 'Returned', action: 'Sets status to RETURNED_FOR_CLARIFICATION with comments.' },
        { label: 'Rejected', action: 'Sets status to REJECTED with comments.' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 5. STEP 3 — REPORTS & VERSIONING
// ──────────────────────────────────────────────────────────────────────────────
export const REPORTS: GuideSection = {
  id: 'reports',
  title: 'Reports & Versioning',
  subtitle: 'Module 1 / Module 2 — Survey reports & approval',
  intro: 'Site surveys generate report versions. Each version moves through an approval state machine.',
  sections: [
    {
      id: 'reports-create',
      title: 'Create a report version',
      body: 'After a survey is submitted, a report version is generated. It starts in DRAFT state.',
      badges: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'RETURNED'],
    },
    {
      id: 'reports-versioning',
      title: 'Report version states',
      body: 'Report versions follow a strict state machine:',
      steps: [
        'DRAFT → IN_REVIEW (a reviewer starts reviewing)',
        'IN_REVIEW → APPROVED (lead architect approves; immutable after this)',
        'IN_REVIEW → RETURNED (lead architect returns for corrections; a new version starts as DRAFT)',
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 5. STEP 4 — REVIEW & APPROVALS
// ──────────────────────────────────────────────────────────────────────────────
export const APPROVALS: GuideSection = {
  id: 'approvals',
  title: 'Approval & Publication',
  subtitle: 'Module 4 — Statutory approvals & publication',
  intro: 'Approval, assignment, and publication are separate audited actions.',
  sections: [
    {
      id: 'approvals-review',
      title: 'Review an approval case',
      body: 'Lead Architects and managers review approval cases. Decisions: APPROVED, REJECTED, RETURNED.',
      badges: ['APPROVED', 'REJECTED', 'RETURNED'],
    },
    {
      id: 'publication-publish',
      title: 'Publish a report',
      body: 'Only approved report versions can be published. Publishing makes the report visible to the client portal.',
      badges: ['APPROVED', 'PUBLISHED_TO_CLIENT'],
      buttons: [
        { label: 'Publish', action: 'Creates a publication record for an approved report version. Requires LEAD_ARCHITECT or ADMIN_MANAGEMENT role.' },
        { label: 'Revoke', action: 'Revokes a publication. Requires LEAD_ARCHITECT or ADMIN_MANAGEMENT role.' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// 6. BUTTON & STATUS REFERENCE
// ──────────────────────────────────────────────────────────────────────────────
export const BUTTON_REFERENCE: GuideSection = {
  id: 'button-reference',
  title: 'Button & Status Reference',
  subtitle: 'Glossary of buttons, status badges, and common errors',
  intro: 'A quick reference for every major button, status badge, and error message you’ll encounter in MBMS.',
  sections: [
    {
      id: 'buttons-common',
      title: 'Common buttons',
      sections: [],
    },
    {
      id: 'status-badges',
      title: 'Status badges',
      sections: [],
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      sections: [],
    },
  ],
};

// Collect all sections for easy export
export const ALL_SECTIONS: GuideSection[] = [
  QUICK_START,
  ROLES_PERMISSIONS,
  BOOKINGS,
  ACCEPTANCE,
  REPORTS,
  APPROVALS,
];

// src/tour/guideContent.ts
// Per-role Welcome Guide content — chapters, examples, permissions.
import type { UserRole } from '../lib/types';

export interface GuideStep {
  action: string;       // what to do
  where: string;        // where in the UI
  example?: string;     // example value / what to type
  tip?: string;         // extra note
}

export interface GuideChapter {
  icon: string;
  title: string;
  description: string;
  steps: GuideStep[];
}

export interface Permission {
  label: string;
  allowed: boolean;
}

export interface RoleGuide {
  welcomeTitle: string;
  welcomeSubtitle: string;
  roleColor: string;        // Tailwind bg class
  roleBadgeColor: string;   // Tailwind text+bg for the badge
  whoYouAre: string;
  whatYouDo: string;
  exampleScenario: string;
  chapters: GuideChapter[];
  permissions: Permission[];
  demoCredentials?: { email: string; password: string; note: string };
}

// ─── LEAD ARCHITECT ──────────────────────────────────────────────────────────
const LEAD_ARCHITECT: RoleGuide = {
  welcomeTitle: 'Welcome, Lead Architect 🏗️',
  welcomeSubtitle: 'You have full control over projects, approvals, and client publications.',
  roleColor: 'bg-brand-600',
  roleBadgeColor: 'bg-brand-100 text-brand-800',
  whoYouAre:
    'You are the most senior technical role on the platform. You review field reports, assign junior architects, approve technical findings, and control exactly what clients see.',
  whatYouDo:
    'Your day-to-day: check the inbox for new enquiries, convert bookings to projects, review site visit reports, approve them, and publish approved content to the client portal.',
  exampleScenario:
    'Example: A potential client, John Kamau, emails Mathmag Builders about a residential solar project. The CRO logs the enquiry. You confirm the site visit booking, assign a field officer, review their submitted report, approve it, and publish it to John\'s portal.',
  chapters: [
    {
      icon: '📬',
      title: 'Step 1 — Enquiry Inbox',
      description: 'All new client enquiries land in the Inbox. Review them and decide whether to convert to a confirmed booking.',
      steps: [
        { action: 'Go to', where: 'Sidebar → Inbox', tip: 'You\'ll see a list of open enquiries from prospective clients.' },
        { action: 'Click', where: 'an enquiry row', tip: 'Opens the conversation thread with the client.' },
        { action: 'Click', where: '"Confirm Booking" button', tip: 'This creates the official booking record. One booking = one project — no duplicates allowed.' },
        { action: 'Fill in', where: 'Booking form', example: 'Site: Westlands, Nairobi | Project type: Residential Solar', tip: 'All fields are required before the booking can be confirmed.' },
      ],
    },
    {
      icon: '🏗️',
      title: 'Step 2 — Projects',
      description: 'Each confirmed booking becomes a project. This is the central record for the entire construction lifecycle.',
      steps: [
        { action: 'Go to', where: 'Sidebar → Projects', tip: 'Shows all active and completed projects.' },
        { action: 'Click', where: 'a project name', tip: 'Opens the project workspace with all 7 modules across the top tabs.' },
        { action: 'Go to', where: 'Planning tab', tip: 'Enter site details: GPS coordinates, solar path data, wind observations, and site sketch notes.' },
        { action: 'Go to', where: 'Acceptance tab', tip: 'Confirm that the site visit has been accepted and the field officer is assigned.' },
      ],
    },
    {
      icon: '📄',
      title: 'Step 3 — Review & Approve Reports',
      description: 'Field officers submit survey reports from the Field App. You review and approve them here before anything goes to the client.',
      steps: [
        { action: 'Go to', where: 'Sidebar → Reports', tip: 'Lists all submitted field reports awaiting your review.' },
        { action: 'Click', where: 'a report to open it', tip: 'Read all sections A–G submitted by the visiting officer.' },
        { action: 'Click', where: '"Approve Report"', tip: 'Locks the report — it becomes immutable. No edits after approval.' },
        { action: 'Click', where: '"Publish to Client"', example: 'Optional note: "Site assessment complete, see attached findings."', tip: 'This is a SEPARATE action from approval. The client only sees it after you explicitly publish.' },
      ],
    },
    {
      icon: '⚖️',
      title: 'Step 4 — Governance',
      description: 'Track risks, compliance milestones, and audit trails. Every critical action is logged automatically.',
      steps: [
        { action: 'Go to', where: 'Sidebar → Governance', tip: 'View the Risk Register, Compliance checklist, and full Audit Log.' },
        { action: 'Click', where: 'Risk tab → "Add Risk"', example: 'Risk: Unstable soil on northern boundary | Severity: High | Mitigation: Foundation reinforcement', tip: 'Risks are version-controlled — you can\'t delete a logged risk, only resolve it.' },
        { action: 'Click', where: 'Audit tab', tip: 'See every action ever taken on this project: who did what and when. This is read-only.' },
      ],
    },
  ],
  permissions: [
    { label: 'View all projects', allowed: true },
    { label: 'Approve site visit reports', allowed: true },
    { label: 'Publish reports to client portal', allowed: true },
    { label: 'Assign junior architects to projects', allowed: true },
    { label: 'Access governance & audit logs', allowed: true },
    { label: 'Manage user accounts', allowed: false },
    { label: 'View other clients\' financial data', allowed: false },
    { label: 'Edit an approved/published report', allowed: false },
  ],
  demoCredentials: { email: 'demo@mathmag.co.ke', password: '(any)', note: 'Demo mode — no password needed, click "Demo as Lead Architect"' },
};

// ─── JUNIOR ARCHITECT ────────────────────────────────────────────────────────
const JUNIOR_ARCHITECT: RoleGuide = {
  ...LEAD_ARCHITECT,
  welcomeTitle: 'Welcome, Junior Architect 📐',
  welcomeSubtitle: 'You work on assigned projects — planning, documentation, and report writing.',
  roleColor: 'bg-blue-600',
  roleBadgeColor: 'bg-blue-100 text-blue-800',
  whoYouAre:
    'You are assigned to specific projects by the Lead Architect. You handle the technical planning, fill in site data, write draft reports, and hand them up for Lead Architect review.',
  whatYouDo:
    'Your work: access your assigned projects, fill in planning data, write site assessment reports, and submit them for Lead Architect approval. You cannot approve or publish.',
  exampleScenario:
    'The Lead Architect assigns you to the Kamau Residential project. You fill in the Planning module with solar path calculations and site sketch notes, write the assessment report, and submit it. The Lead Architect then reviews and approves it.',
  permissions: [
    { label: 'View assigned projects', allowed: true },
    { label: 'Fill in planning & site data', allowed: true },
    { label: 'Write and submit draft reports', allowed: true },
    { label: 'Approve reports', allowed: false },
    { label: 'Publish to client portal', allowed: false },
    { label: 'View all projects (unassigned)', allowed: false },
    { label: 'Access governance audit log', allowed: true },
    { label: 'Edit an approved report', allowed: false },
  ],
};

// ─── CLIENT RELATIONS OFFICER ────────────────────────────────────────────────
const CRO: RoleGuide = {
  welcomeTitle: 'Welcome, Client Relations Officer 📞',
  welcomeSubtitle: 'You are the bridge between clients and the technical team.',
  roleColor: 'bg-amber-600',
  roleBadgeColor: 'bg-amber-100 text-amber-800',
  whoYouAre:
    'You are the first point of contact for clients. You log enquiries, manage communications, confirm bookings, and keep clients informed — without touching the technical site data.',
  whatYouDo:
    'Log incoming client enquiries, respond to messages, convert qualified enquiries to confirmed bookings, and coordinate with the architect team on scheduling.',
  exampleScenario:
    'Mary Wanjiru calls about a commercial solar project in Karen. You log her enquiry in the Inbox, start a conversation thread, ask qualifying questions, and once she\'s ready, convert the enquiry to a confirmed booking that the Lead Architect can action.',
  chapters: [
    {
      icon: '📬',
      title: 'Logging an Enquiry',
      description: 'When a client contacts Mathmag Builders, you create an enquiry record.',
      steps: [
        { action: 'Go to', where: 'Sidebar → Inbox' },
        { action: 'Click', where: '"New Enquiry" button (top right)' },
        { action: 'Fill in', where: 'Client name, email, phone', example: 'Mary Wanjiru | mary@email.com | +254 712 345 678' },
        { action: 'Fill in', where: 'Project description', example: 'Commercial solar installation, Karen, 50kW system estimate' },
        { action: 'Click', where: '"Save Enquiry"', tip: 'The Lead Architect is notified automatically.' },
      ],
    },
    {
      icon: '💬',
      title: 'Managing Conversations',
      description: 'All client communication is logged in the conversation thread.',
      steps: [
        { action: 'Click', where: 'an enquiry to open it' },
        { action: 'Type a message', where: 'Reply box at the bottom', example: 'Hi Mary, thank you for your enquiry. We\'ll arrange a site visit within 5 working days.' },
        { action: 'Click', where: '"Send"', tip: 'Messages are timestamped and cannot be deleted — full audit trail.' },
      ],
    },
    {
      icon: '✅',
      title: 'Confirming a Booking',
      description: 'When the client agrees to proceed, convert the enquiry to a formal booking.',
      steps: [
        { action: 'Open', where: 'the enquiry' },
        { action: 'Click', where: '"Confirm Booking"', tip: 'This creates the project record. Important: one booking = exactly one project.' },
        { action: 'Set', where: 'Scheduled site visit date', example: '2026-12-01' },
        { action: 'Click', where: '"Save"', tip: 'The booking is now locked. The Lead Architect assigns a field officer.' },
      ],
    },
  ],
  permissions: [
    { label: 'Log and manage enquiries', allowed: true },
    { label: 'Send messages to clients', allowed: true },
    { label: 'Confirm bookings', allowed: true },
    { label: 'View project status', allowed: true },
    { label: 'Approve or publish reports', allowed: false },
    { label: 'Edit site / technical data', allowed: false },
    { label: 'Access governance audit log', allowed: false },
    { label: 'View financial contract details', allowed: false },
  ],
};

// ─── ADMIN MANAGEMENT ────────────────────────────────────────────────────────
const ADMIN: RoleGuide = {
  welcomeTitle: 'Welcome, Management 👔',
  welcomeSubtitle: 'You have read-only oversight of all projects, financials, and governance.',
  roleColor: 'bg-gray-700',
  roleBadgeColor: 'bg-gray-100 text-gray-800',
  whoYouAre:
    'You are a senior management or administrative user. You can view all projects, reports, contracts, and governance records across the company — but you do not perform technical actions.',
  whatYouDo:
    'Monitor project pipelines, review financial summaries in Contracts, check governance compliance, and read audit logs.',
  exampleScenario:
    'You open the Projects list to see all 12 active projects. You click the Kamau Residential project, check the Contracts tab to see payment milestone status, then check the Governance tab to confirm all compliance milestones are met before the final handover.',
  chapters: [
    {
      icon: '📊',
      title: 'Project Overview',
      description: 'Get a bird\'s eye view of all active projects.',
      steps: [
        { action: 'Go to', where: 'Dashboard', tip: 'See total active projects, pending approvals, and overdue actions.' },
        { action: 'Go to', where: 'Projects', tip: 'Filter by status: Active, Completed, On Hold.' },
        { action: 'Click', where: 'any project', tip: 'All 7 module tabs are visible in read-only mode.' },
      ],
    },
    {
      icon: '💰',
      title: 'Financial Summary',
      description: 'Review contract values and payment milestones.',
      steps: [
        { action: 'Open', where: 'a project → Contracts tab' },
        { action: 'View', where: 'Payments subtab', tip: 'See invoiced amounts, payment dates, and outstanding balances in KES.' },
        { action: 'View', where: 'Milestones subtab', tip: 'Track which project milestones have been reached and paid.' },
      ],
    },
  ],
  permissions: [
    { label: 'View all projects (read-only)', allowed: true },
    { label: 'View financial contract data', allowed: true },
    { label: 'View governance & audit logs', allowed: true },
    { label: 'Approve or publish reports', allowed: false },
    { label: 'Edit any project data', allowed: false },
    { label: 'Manage user accounts', allowed: false },
    { label: 'Send messages to clients', allowed: false },
  ],
};

// ─── VISITING OFFICER (FIELD) ─────────────────────────────────────────────────
const VISITING_OFFICER: RoleGuide = {
  welcomeTitle: 'Welcome, Field Officer 📋',
  welcomeSubtitle: 'You conduct site visits and submit survey reports from the field.',
  roleColor: 'bg-emerald-600',
  roleBadgeColor: 'bg-emerald-100 text-emerald-800',
  whoYouAre:
    'You are a Visiting Officer who visits client sites and completes the official MBMS site survey form. Your survey data drives all subsequent technical analysis.',
  whatYouDo:
    'Open an assigned visit, complete survey sections A–G (site details, measurements, solar analysis, wind data, photos, notes), and submit. The form works fully offline.',
  exampleScenario:
    'You arrive at Mary Wanjiru\'s site in Karen at 9am. You open the Field App, tap your assigned visit, and work through sections A–G over 2 hours. Your signal drops mid-way — no problem, the form saves locally. When you\'re back in range, you tap Submit and it syncs automatically.',
  chapters: [
    {
      icon: '📍',
      title: 'Starting a Site Visit',
      description: 'All visits assigned to you appear on your dashboard.',
      steps: [
        { action: 'Open', where: 'the Field App (this screen)', tip: 'Your assigned visits are listed with the client name, address, and scheduled date.' },
        { action: 'Tap', where: 'a visit card to open it', tip: 'Downloads any offline data needed before you lose signal.' },
        { action: 'Tap', where: '"Start Survey"', tip: 'Records the start time automatically.' },
      ],
    },
    {
      icon: '📝',
      title: 'Filling Sections A–G',
      description: 'The survey has 7 sections — work through them in order.',
      steps: [
        { action: 'Section A', where: 'Site Identification', example: 'GPS: -1.3167, 36.7833 | Land type: Residential | Plot size: 0.25 acres', tip: 'GPS auto-fills if you allow location access.' },
        { action: 'Section B', where: 'Roof/Structure Assessment', example: 'Material: Iron sheet | Condition: Good | Orientation: South-facing | Pitch: 20°' },
        { action: 'Section C', where: 'Solar Path Analysis', example: 'Peak sun hours: 5.8 | Shading: None | Panel area available: 40m²', tip: 'Computed from GPS — verify the auto-calculated values.' },
        { action: 'Section D', where: 'Wind & Environment', example: 'Avg wind speed: 12 km/h | Direction: SE | Trees/obstacles: None within 10m' },
        { action: 'Section E', where: 'Electrical Assessment', example: 'Existing supply: 3-phase | Meter type: Prepaid | Load estimate: 15kW', tip: 'Photograph the existing meter and distribution board.' },
        { action: 'Section F', where: 'Site Sketch', example: 'Draw roof outline, mark North, indicate panel placement zones', tip: 'Use your finger or a stylus. The sketch is uploaded as an image.' },
        { action: 'Section G', where: 'Officer Notes & Sign-off', example: 'Key observations, any access issues, recommended follow-up actions', tip: 'Add your signature. This locks the form.' },
      ],
    },
    {
      icon: '📤',
      title: 'Submitting the Report',
      description: 'Submit when all sections are complete. Works offline too.',
      steps: [
        { action: 'Review', where: 'the Summary page', tip: 'Check all sections are marked ✓ before submitting.' },
        { action: 'Tap', where: '"Submit Report"', tip: 'If offline, the report queues and syncs when you reconnect. You\'ll see a "Pending sync" badge.' },
        { action: 'Wait for', where: '"Submitted ✓" confirmation', tip: 'The Lead Architect is notified and will review within 48 hours.' },
      ],
    },
  ],
  permissions: [
    { label: 'View your assigned site visits', allowed: true },
    { label: 'Complete and submit survey forms', allowed: true },
    { label: 'Work offline (auto-sync later)', allowed: true },
    { label: 'View submitted report after upload', allowed: true },
    { label: 'View other officers\' visits', allowed: false },
    { label: 'Approve or edit submitted reports', allowed: false },
    { label: 'Access staff portal or projects list', allowed: false },
    { label: 'View client contact details', allowed: false },
  ],
  demoCredentials: { email: 'field@mathmag.co.ke', password: '(any)', note: 'Demo mode — click "Demo as Field Officer" on the login page' },
};

// ─── CLIENT ───────────────────────────────────────────────────────────────────
const CLIENT: RoleGuide = {
  welcomeTitle: 'Welcome to your Project Portal 🏠',
  welcomeSubtitle: 'Track your construction project — only your project, only approved content.',
  roleColor: 'bg-violet-600',
  roleBadgeColor: 'bg-violet-100 text-violet-800',
  whoYouAre:
    'You are a client of Mathmag Builders. This portal gives you a live, transparent view of your project — from initial site visit right through to handover.',
  whatYouDo:
    'View your project status, read approved site reports, download official documents, and track construction milestones as the team publishes updates.',
  exampleScenario:
    'You commissioned Mathmag Builders for a residential solar project. The site visit is done, the report is approved. You log in to see the full site assessment, download the PDF, and check that the installation is scheduled for next month.',
  chapters: [
    {
      icon: '🏠',
      title: 'Your Project',
      description: 'Your portal shows only your project — private and secure.',
      steps: [
        { action: 'You will see', where: 'Your project card on this screen', tip: 'Shows the current status: Under Assessment, Report Approved, Installation Scheduled, Complete.' },
        { action: 'Click', where: 'the project card', tip: 'Opens the full project detail view.' },
        { action: 'Check', where: 'Project Status badge at the top', tip: 'Updated in real-time as the team progresses your project.' },
      ],
    },
    {
      icon: '📄',
      title: 'Site Visit Reports',
      description: 'Read the official site assessment — only published after Lead Architect review.',
      steps: [
        { action: 'Go to', where: 'Reports section in your project', tip: 'Only reports that have been approved AND explicitly published appear here.' },
        { action: 'Click', where: 'a report to read it', tip: 'Shows all sections: site details, solar analysis, recommendations.' },
        { action: 'Click', where: '"Download PDF"', tip: 'Generates a formatted PDF copy for your records.' },
      ],
    },
    {
      icon: '📅',
      title: 'Project Timeline',
      description: 'See where your project is in the lifecycle.',
      steps: [
        { action: 'View', where: 'Timeline / Milestones section', tip: 'Shows: Enquiry → Site Visit → Report Approved → Design → Installation → Handover.' },
        { action: 'Green milestones', where: 'are completed', tip: 'Grey milestones are upcoming.' },
        { action: 'Look for', where: 'Scheduled date labels', example: 'Installation scheduled: 1 Jan 2027', tip: 'Dates are only shown after the team confirms them.' },
      ],
    },
    {
      icon: '💬',
      title: 'Contacting the Team',
      description: 'Raise questions or requests directly through the portal.',
      steps: [
        { action: 'Go to', where: 'Messages section of your project' },
        { action: 'Type your message', where: 'Message box', example: 'Hi, I\'d like to confirm the installation date for January.' },
        { action: 'Click', where: '"Send"', tip: 'Your Client Relations Officer is notified and will respond within 1 business day.' },
      ],
    },
  ],
  permissions: [
    { label: 'View your own project', allowed: true },
    { label: 'Read published reports & documents', allowed: true },
    { label: 'Download approved PDF reports', allowed: true },
    { label: 'Send messages to the project team', allowed: true },
    { label: 'View draft / unapproved reports', allowed: false },
    { label: 'View other clients\' projects', allowed: false },
    { label: 'Edit any project data', allowed: false },
    { label: 'View internal staff notes', allowed: false },
  ],
  demoCredentials: { email: 'client@demo.co.ke', password: '(any)', note: 'Demo mode — click "Demo as Client" on the login page' },
};

// ─── Lookup ───────────────────────────────────────────────────────────────────
export function guideForRole(role: UserRole): RoleGuide {
  switch (role) {
    case 'LEAD_ARCHITECT':     return LEAD_ARCHITECT;
    case 'JUNIOR_ARCHITECT':   return JUNIOR_ARCHITECT;
    case 'CLIENT_RELATIONS_OFFICER': return CRO;
    case 'ADMIN_MANAGEMENT':   return ADMIN;
    case 'VISITING_OFFICER':   return VISITING_OFFICER;
    case 'CLIENT':             return CLIENT;
    default:                   return LEAD_ARCHITECT;
  }
}

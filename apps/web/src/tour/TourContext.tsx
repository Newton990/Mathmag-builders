// src/tour/TourContext.tsx
// Manages the guided onboarding tour state.
// The tour auto-starts on first login and remembers completion in localStorage.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserRole } from '../lib/types';

// ─── Step definition ──────────────────────────────────────────────────────────
export interface TourStep {
  /** CSS selector or data-tour attribute target, e.g. '[data-tour="sidebar"]' */
  target: string;
  /** Short heading shown in the tooltip */
  title: string;
  /** Body text explaining the feature */
  body: string;
  /** Where to place the tooltip relative to the target */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

// ─── Role-specific step sets ──────────────────────────────────────────────────
const STAFF_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: '👋 Welcome to MBMS',
    body: 'This is the Staff Portal for Mathmag Builders. Use the sidebar on the left to navigate between modules.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: '📊 Dashboard',
    body: 'Your home screen. See live KPIs, recent activity, and outstanding actions at a glance.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-inbox"]',
    title: '📬 Enquiry Inbox',
    body: 'All client enquiries land here. Create bookings, convert them to projects, and manage conversations.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-projects"]',
    title: '🏗️ Projects',
    body: 'Every confirmed booking becomes a project. Click a project to access its planning, contracts, construction timeline, and more.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-reports"]',
    title: '📄 Reports',
    body: 'Site visit reports submitted by field officers appear here for review, approval, and controlled publication to the client.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-governance"]',
    title: '⚖️ Governance',
    body: 'Risk registers, compliance checks, audit trails, and project closure. Every critical action is logged here.',
    placement: 'right',
  },
  {
    target: '[data-tour="user-panel"]',
    title: '👤 Your Account',
    body: "Your name and role are shown here. When you're done, use Sign out to end your session securely.",
    placement: 'top',
  },
];

const FIELD_STEPS: TourStep[] = [
  {
    target: '[data-tour="field-header"]',
    title: '👋 Welcome, Field Officer!',
    body: 'This is the MBMS Field App — optimised for mobile. It works offline too: surveys are saved locally and sync when you reconnect.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="field-visits"]',
    title: '📋 Your Assigned Visits',
    body: 'All site visits assigned to you appear here. Tap a visit to open the survey form.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="field-sync"]',
    title: '🔄 Online / Offline Indicator',
    body: "This shows your connection status. If you go offline mid-survey, don't worry — your work is saved and will sync automatically.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="field-nav"]',
    title: '🧭 Navigation',
    body: 'Use the bottom bar to switch between your visits and other sections. The app remembers where you were even after closing the browser.',
    placement: 'top',
  },
];

const CLIENT_STEPS: TourStep[] = [
  {
    target: '[data-tour="portal-header"]',
    title: '👋 Welcome to your Client Portal!',
    body: "This is your dedicated view of your construction project with Mathmag Builders. Only information that's been reviewed and approved is shown here.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-projects"]',
    title: '🏠 Your Project',
    body: 'Click your project to see the full status, site visit reports, documents, and construction progress published by the team.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="portal-nav"]',
    title: '🔒 Your Private View',
    body: "Everything here is specific to you. You'll only ever see your own project — nothing from other clients is visible.",
    placement: 'bottom',
  },
];

export function stepsForRole(role: UserRole): TourStep[] {
  if (role === 'VISITING_OFFICER') return FIELD_STEPS;
  if (role === 'CLIENT') return CLIENT_STEPS;
  return STAFF_STEPS;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface TourContextValue {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  next: () => void;
  prev: () => void;
  skip: () => void;
  restart: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

function tourKey(role: UserRole) {
  return `mbms.tour.done.${role}`;
}

export function TourProvider({
  children,
  role,
}: {
  children: ReactNode;
  role: UserRole;
}) {
  const steps = useMemo(() => stepsForRole(role), [role]);
  const key = tourKey(role);

  // Auto-start if the user hasn't completed the tour yet for this role.
  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem(key) !== 'done';
    } catch {
      return true;
    }
  });
  const [stepIndex, setStepIndex] = useState(0);

  const finish = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(key, 'done');
    } catch { /* storage unavailable */ }
  }, [key]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) { finish(); return i; }
      return i + 1;
    });
  }, [steps.length, finish]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = finish;

  const restart = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setStepIndex(0);
    setActive(true);
  }, [key]);

  // Reset step counter when tour re-activates.
  useEffect(() => {
    if (active) setStepIndex(0);
  }, [active]);

  const value = useMemo<TourContextValue>(
    () => ({ active, stepIndex, steps, next, prev, skip, restart }),
    [active, stepIndex, steps, next, prev, skip, restart],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}

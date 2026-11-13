// Staff layout — desktop-first sidebar for office users.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { humanize } from '../lib/format';
import { TourProvider } from '../tour/TourContext';
import { TourOverlay, RestartTourButton } from '../tour/TourOverlay';
import { WelcomeGuide } from '../tour/WelcomeGuide';
import { OnboardingModal } from '../tour/OnboardingModal';
import { HintModeProvider } from '../tour/HintModeContext';
import { GlobalHelpTooltip } from '../tour/GlobalHelpTooltip';
import { HintModeToggle } from '../tour/HintModeToggle';

const navItems = [
  { to: '/staff', label: 'Dashboard', end: true,       tourId: 'nav-dashboard',  help: 'Your home screen: live KPIs, upcoming visits, and reports awaiting your action.' },
  { to: '/staff/inbox', label: 'Inbox', end: false,    tourId: 'nav-inbox',      help: 'All client enquiries and conversations. Convert them to bookings here.' },
  { to: '/staff/projects', label: 'Projects', end: false, tourId: 'nav-projects', help: 'All confirmed projects. Click a project to access planning, contracts, construction, and governance.' },
  { to: '/staff/reports', label: 'Reports', end: false,  tourId: 'nav-reports',  help: 'Site visit reports submitted by field officers. Review, approve, and publish them to clients.' },
  { to: '/staff/governance', label: 'Governance', end: false, tourId: 'nav-governance', help: 'Risk registers, compliance milestones, audit logs, and project closure records.' },
];

export function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  return (
    <HintModeProvider>
    <TourProvider role={user.role}>
      <div className="flex h-screen bg-slate-100 text-slate-900" data-testid="staff-layout">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside
          className="hidden w-72 flex-col bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white shadow-2xl shadow-brand-900/20 lg:flex"
          data-tour="sidebar"
        >
          <div className="flex items-start justify-between border-b border-white/10 p-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">MBMS</h1>
              <p className="mt-1 text-xs text-blue-200">Mathmag Builders</p>
            </div>
            <HintModeToggle />
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-blue-200/80">Navigation</p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-tour={item.tourId}
                data-help={item.help}
                title={item.help}
                aria-label={`Open ${item.label} section: ${item.help}`}
                className={({ isActive }) =>
                  `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/12 text-white shadow-inner shadow-white/10'
                      : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div
            className="border-t border-white/10 bg-white/5 p-4 text-xs text-blue-100"
            data-tour="user-panel"
          >
            <p className="font-semibold text-white">{user?.name}</p>
            <p className="mt-1 opacity-90">{user ? humanize(user.role) : ''}</p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-3 text-blue-200 underline decoration-blue-300/70 underline-offset-4 transition-colors hover:text-white"
              title="Sign out of the staff portal and return to the login screen"
              aria-label="Sign out of the staff portal"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-4 text-white shadow-lg shadow-brand-900/15 lg:hidden">
            <h1 className="text-lg font-bold tracking-tight">MBMS</h1>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-xs underline decoration-white/60 underline-offset-4"
              title="Sign out of the staff portal and return to the login screen"
              aria-label="Sign out of the staff portal"
            >
              Sign out
            </button>
          </header>

          {/* Mobile nav strip */}
          <div className="border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur lg:hidden">
            <nav className="flex gap-3 overflow-x-auto text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-brand-200 hover:text-brand-700"
                  title={item.help}
                  aria-label={`Open ${item.label} section`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Tour & help system */}
      <OnboardingModal />
      <WelcomeGuide />
      <TourOverlay />
      <RestartTourButton />
      <GlobalHelpTooltip />
    </TourProvider>
    </HintModeProvider>
  );
}

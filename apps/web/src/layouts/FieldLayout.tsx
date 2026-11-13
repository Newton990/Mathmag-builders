// Field layout — mobile-first, offline-capable PWA shell.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { TourProvider } from '../tour/TourContext';
import { TourOverlay, RestartTourButton } from '../tour/TourOverlay';
import { WelcomeGuide } from '../tour/WelcomeGuide';
import { OnboardingModal } from '../tour/OnboardingModal';
import { HintModeProvider } from '../tour/HintModeContext';
import { GlobalHelpTooltip } from '../tour/GlobalHelpTooltip';
import { HintModeToggle } from '../tour/HintModeToggle';

export function FieldLayout() {
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
      <div className="flex min-h-screen flex-col bg-slate-100" data-testid="field-layout">
        <header
          className="safe-top sticky top-0 z-10 bg-gradient-to-r from-brand-900 via-brand-800 to-emerald-800 text-white shadow-lg shadow-brand-900/15"
          data-tour="field-header"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-base font-bold tracking-tight">MBMS Field</h1>
              <p className="text-xs text-blue-100">{user?.name ?? 'Visiting officer'}</p>
            </div>
            <div className="flex items-center gap-2">
              <HintModeToggle />
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium tracking-wide text-blue-100" id="sync-status" data-tour="field-sync">
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="text-xs underline decoration-white/60 underline-offset-4"
                data-help="Sign out of the Field App. Your submitted reports are saved on the server."
                title="Sign out of the field app and return to the login screen"
                aria-label="Sign out of the field app"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20" data-tour="field-visits">
          <Outlet />
        </main>

        <nav
          className="safe-bottom fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur"
          data-tour="field-nav"
        >
          <div className="flex items-center justify-around py-2">
            <NavLink
              to="/field"
              end
              className="flex flex-col items-center rounded-xl px-3 py-2 text-xs text-brand-700 transition-colors hover:bg-brand-50"
              data-help="Return to your list of assigned site visits."
              title="View your assigned site visits"
              aria-label="Open My visits"
            >
              <span className="text-xl">⌂</span>
              <span>My visits</span>
            </NavLink>
          </div>
        </nav>
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

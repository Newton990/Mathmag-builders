// Client portal layout — shows only explicitly published content.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { TourProvider } from '../tour/TourContext';
import { TourOverlay, RestartTourButton } from '../tour/TourOverlay';
import { WelcomeGuide } from '../tour/WelcomeGuide';
import { OnboardingModal } from '../tour/OnboardingModal';
import { HintModeProvider } from '../tour/HintModeContext';
import { GlobalHelpTooltip } from '../tour/GlobalHelpTooltip';
import { HintModeToggle } from '../tour/HintModeToggle';

export function PortalLayout() {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50" data-testid="portal-layout">
        <header
          className="sticky top-0 z-10 border-b border-violet-100 bg-white/90 shadow-sm backdrop-blur"
          data-tour="portal-header"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-base font-bold tracking-tight text-gray-900">Mathmag Builders</h1>
              <p className="text-xs text-gray-500">Client Portal · {user?.name}</p>
            </div>
            <div className="flex items-center gap-3 text-xs" data-tour="portal-nav">
              <HintModeToggle />
              <NavLink
                to="/portal"
                className="rounded-full bg-violet-50 px-3 py-1.5 font-medium text-brand-700 transition-colors hover:bg-violet-100"
                data-help="Go back to your list of projects."
                title="Return to your client project list"
                aria-label="Open My projects"
              >
                My projects
              </NavLink>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="text-gray-500 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-700"
                data-help="Sign out of your client portal securely."
                title="Sign out of the client portal and return to the login screen"
                aria-label="Sign out of the client portal"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6" data-tour="portal-projects">
          <Outlet />
        </main>

        <footer className="py-6 text-center text-xs text-gray-400">
          Mathmag Builders Limited · Client Portal · Only published content is shown.
        </footer>
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

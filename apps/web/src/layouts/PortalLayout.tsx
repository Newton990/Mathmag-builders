// Client portal layout — shows only explicitly published content.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="portal-layout">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900">Mathmag Builders</h1>
            <p className="text-xs text-gray-500">Client Portal · {user?.name}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <NavLink to="/portal" className="text-brand-700">
              My projects
            </NavLink>
            <button type="button" onClick={() => void handleLogout()} className="text-gray-500 underline">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        Mathmag Builders Limited · Client Portal · Only published content is shown.
      </footer>
    </div>
  );
}

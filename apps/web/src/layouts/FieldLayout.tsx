// Field layout — mobile-first, offline-capable PWA shell.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function FieldLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50" data-testid="field-layout">
      <header className="safe-top sticky top-0 z-10 bg-brand-900 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-bold">MBMS Field</h1>
            <p className="text-xs text-blue-200">{user?.name ?? 'Visiting officer'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200" id="sync-status">
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
            <button type="button" onClick={() => void handleLogout()} className="text-xs underline">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-around py-2">
          <NavLink to="/field" end className="flex flex-col items-center text-xs text-brand-700">
            <span className="text-xl">⌂</span>
            <span>My visits</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

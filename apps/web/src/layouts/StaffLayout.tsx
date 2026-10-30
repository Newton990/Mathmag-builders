// Staff layout — desktop-first sidebar for office users.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { humanize } from '../lib/format';

const navItems = [
  { to: '/staff', label: 'Dashboard', end: true },
  { to: '/staff/inbox', label: 'Inbox', end: false },
  { to: '/staff/projects', label: 'Projects', end: false },
  { to: '/staff/reports', label: 'Reports', end: false },
];

export function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen bg-gray-50" data-testid="staff-layout">
      <aside className="hidden w-64 flex-col bg-brand-900 text-white lg:flex">
        <div className="border-b border-brand-700 p-6">
          <h1 className="text-xl font-bold">MBMS</h1>
          <p className="mt-1 text-xs text-blue-200">Mathmag Builders</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-blue-300">Navigation</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-brand-700 text-white' : 'text-blue-100 hover:bg-brand-700/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-700 p-4 text-xs text-blue-200">
          <p className="font-semibold text-white">{user?.name}</p>
          <p>{user ? humanize(user.role) : ''}</p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-2 text-blue-300 underline hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-brand-900 p-4 text-white lg:hidden">
          <h1 className="text-lg font-bold">MBMS</h1>
          <button type="button" onClick={() => void handleLogout()} className="text-xs underline">
            Sign out
          </button>
        </header>

        <div className="border-b border-gray-200 bg-white px-6 py-3 lg:hidden">
          <nav className="flex gap-3 overflow-x-auto text-sm">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="whitespace-nowrap text-gray-600">
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

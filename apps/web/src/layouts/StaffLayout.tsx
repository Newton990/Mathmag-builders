// Staff layout — desktop-first sidebar layout for employee dashboard
import { Outlet } from 'react-router-dom';

export function StaffLayout() {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="staff-layout">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col bg-brand-900 text-white">
        <div className="p-6 border-b border-brand-700">
          <h1 className="text-xl font-bold">MBMS</h1>
          <p className="text-xs text-blue-200 mt-1">Mathmag Builders</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs uppercase tracking-wider text-blue-300 mb-3">Navigation</p>
          {/* Step 4+ will populate with role-specific nav items */}
          <a href="/staff" className="flex items-center px-3 py-2 rounded-lg bg-brand-700 text-white text-sm">
            Dashboard
          </a>
        </nav>
        <div className="p-4 border-t border-brand-700 text-xs text-blue-300">
          Staff Portal · v1.0
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-brand-900 text-white p-4 flex items-center gap-3">
          <h1 className="text-lg font-bold">MBMS</h1>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

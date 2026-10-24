// Client portal layout — mobile-friendly, shows only published content
import { Outlet } from 'react-router-dom';

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-gray-50" data-testid="portal-layout">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Mathmag Builders</h1>
            <p className="text-xs text-gray-500">Client Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Mathmag Builders Limited · Client Portal · v1.0
      </footer>
    </div>
  );
}

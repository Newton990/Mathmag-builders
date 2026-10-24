// Field layout — mobile-first layout for visiting officers (PWA)
import { Outlet } from 'react-router-dom';

export function FieldLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="field-layout">
      {/* Top navigation bar */}
      <header className="bg-brand-900 text-white sticky top-0 z-10 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">MBMS Field</h1>
            <p className="text-xs text-blue-200">Mathmag Builders</p>
          </div>
          {/* Offline indicator — Step 6 will wire this up */}
          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full" id="sync-status">
            Online
          </span>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around py-2">
          <a href="/field" className="flex flex-col items-center text-xs text-brand-700">
            <span className="text-xl">🏠</span>
            <span>Home</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

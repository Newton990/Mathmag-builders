// src/pages/staff/StaffGuidePage.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Badge, EmptyState, SectionTitle, StatCard } from '../../components/ui';
import { ALL_SECTIONS } from '../../components/GuideContent';

export function StaffGuidePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  const filteredSections = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_SECTIONS.filter((section) => {
      if (section.title.toLowerCase().includes(q) || section.subtitle.toLowerCase().includes(q)) {
        return true;
      }
      return section.sections.some((item) => {
        return item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q) ||
          item.badges?.some((b) => b.toLowerCase().includes(q)) ||
          item.buttons?.some((b) => b.label.toLowerCase().includes(q)) ||
          item.fields?.some((f) => f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
      });
    });
  }, [query]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 text-white shadow-2xl lg:flex">
        <div className="flex items-start justify-between border-b border-white/10 p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">MBMS</h1>
            <p className="mt-1 text-xs text-blue-200">Mathmag Builders</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="text-xs underline decoration-white/60 underline-offset-4 transition-colors hover:text-white"
            title="Back to staff dashboard"
            aria-label="Back to staff dashboard"
          >
            ← Dashboard
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-blue-200/80">User Guide</p>

          <div className="mb-6 relative">
            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search help topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>

          <nav className="space-y-1">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeSectionId === section.id ? 'bg-brand-700 text-white shadow-inner shadow-white/10' : 'text-gray-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xs font-medium">{section.title}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-white/10 bg-white/5 p-4 text-xs text-blue-100">
            <p className="font-semibold text-white">{user?.name}</p>
            <p className="mt-1 opacity-90">{user?.role}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-3 text-blue-200 underline decoration-blue-300/70 transition-colors hover:text-white"
              title="Sign out"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </nav>
      </aside>

        {/* Main content */}
        <div className="flex-1 flex-col overflow-hidden bg-slate-100">
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-4 text-white shadow-lg lg:hidden">
            <h1 className="text-lg font-bold tracking-tight">MBMS User Guide</h1>
            <button
              type="button"
              onClick={() => navigate('/staff')}
              className="text-xs underline decoration-white/60 underline-offset-4 hover:text-white"
              title="Back to staff dashboard"
              aria-label="Back to staff dashboard"
            >
              ← Dashboard
            </button>
          </header>

          <main className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Guide</h1>
              <p className="mt-1 text-sm text-gray-500">
                Your guide to the MBMS staff portal. Browse by section or search for a topic.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Guides" value={ALL_SECTIONS.length} tone="blue" />
              <StatCard label="Topics" value={ALL_SECTIONS.reduce((sum, s) => sum + s.sections.length, 0)} tone="green" />
              <StatCard label="Roles" value={5} tone="amber" />
              <StatCard label="Status codes" value={6} tone="purple" />
            </div>

            <div className="max-w-3xl mx-auto">
              {filteredSections.length === 0 && query.length > 0 ? (
                <EmptyState title="No results found" hint="Try a different search term." />
              ) : (
                <div className="space-y-6">
                  {filteredSections.map((section) => (
                    <div key={section.id} className="rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/50 p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                          <p className="mt-1 text-sm text-gray-500">{section.subtitle}</p>
                        </div>
                        <Badge tone="blue">{section.sections.length} topics</Badge>
                      </div>

                      <div className="space-y-4">
                        {section.sections.map((item) => (
                          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 mb-4 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="text-sm font-medium text-gray-900">{item.title}</span>
                              {item.badges?.map((badge) => (
                                <Badge key={badge} tone="gray">{badge}</Badge>
                              ))}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.body}</p>

                            {(item.fields?.length ?? 0) > 0 && (
                              <div className="mb-4">
                                <SectionTitle>Fields</SectionTitle>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {item.fields.map((field) => (
                                    <div key={field.label} className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                                      <p className="text-xs font-medium text-gray-700 uppercase tracking-[0.1em]">{field.label}</p>
                                      <p className="text-xs text-gray-600">{field.description}</p>
                                      {field.required && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                          Required
                                        </span>
                                      )}
                                      {field.example && (
                                        <p className="text-[10px] text-gray-500 mt-1">
                                          Example: {field.example}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(item.buttons?.length ?? 0) > 0 && (
                              <div className="mt-4">
                                <SectionTitle>Actions</SectionTitle>
                                <div className="flex flex-wrap gap-2">
                                  {item.buttons.map((btn) => (
                                    <button
                                      key={btn.label}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      disabled
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                  {item.buttons.map((b) => `${b.label}: ${b.action}`).join(' | ')}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
    </div>
  );
}

export default StaffGuidePage;

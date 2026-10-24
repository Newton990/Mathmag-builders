export function StaffDashboardPage() {
  return (
    <div data-testid="staff-dashboard">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Staff Dashboard</h2>
      <p className="text-gray-500 mb-6">Welcome to the MBMS employee portal.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Inbox', 'Projects', 'Reports'].map((section) => (
          <div key={section} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{section}</h3>
            <p className="text-sm text-gray-400">Coming in later steps</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FieldDashboardPage() {
  return (
    <div className="p-4" data-testid="field-dashboard">
      <h2 className="text-xl font-bold text-gray-900 mb-1">My Visits</h2>
      <p className="text-sm text-gray-500 mb-6">Your assigned site visits</p>

      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Today</p>
          <p className="text-gray-400 text-sm mt-2">No visits today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Upcoming</p>
          <p className="text-gray-400 text-sm mt-2">No upcoming visits</p>
        </div>
      </div>

      <p className="text-xs text-center text-gray-300 mt-8">Visit assignment coming in Step 5</p>
    </div>
  );
}

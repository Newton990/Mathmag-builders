export function ClientPortalPage() {
  return (
    <div data-testid="client-portal">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">My Project</h2>
        <p className="text-sm text-gray-500">Your project details will appear here once published by your architect.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Note:</strong> This portal shows only documents and reports that have been explicitly shared with you.
      </div>

      <p className="text-xs text-center text-gray-300 mt-8">Portal content coming in Step 10</p>
    </div>
  );
}

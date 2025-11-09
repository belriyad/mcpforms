import ActivityLogTable from '@/components/admin/analytics/ActivityLogTable';

export default function ActivityLogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">
            Track intake submissions, document generations, and system events
          </p>
        </div>

        {/* Activity Log Table Component */}
        <ActivityLogTable />
      </div>
    </div>
  );
}

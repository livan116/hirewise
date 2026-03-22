export default function JobResultsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">
          Resumes uploaded successfully
        </p>
        <p className="text-xs text-gray-400 mt-1">
          AI screening is running in the background
        </p>
        <p className="text-xs text-gray-400 mt-3">Job ID: {params.id}</p>
        <a
          href="/dashboard"
          className="mt-6 inline-block text-sm text-gray-500 underline"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}

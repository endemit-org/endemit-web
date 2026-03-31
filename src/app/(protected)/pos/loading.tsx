export default function PosLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="h-7 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>

        <ul className="divide-y divide-gray-200">
          {[1, 2, 3].map(i => (
            <li key={i} className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-48 bg-gray-100 rounded mb-3" />
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                    <div className="h-5 w-24 bg-green-100 rounded" />
                  </div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

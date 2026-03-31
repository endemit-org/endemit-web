export default function PosRegisterLoading() {
  return (
    <div className="min-h-screen bg-gray-100 animate-pulse">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-7 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Items Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Cart / Order Panel */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-3 mb-6">
              {[1, 2].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between">
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="h-6 w-36 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-5 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

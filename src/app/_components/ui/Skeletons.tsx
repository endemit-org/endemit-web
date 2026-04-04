export function ProfileSidebarSkeleton() {
  return (
    <div className="bg-neutral-950 rounded-lg p-6 animate-pulse">
      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30" />
        <div className="h-6 w-32 bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-40 bg-neutral-800 rounded" />
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="h-4 w-20 bg-neutral-800 rounded" />
          <span className="text-neutral-600">|</span>
          <div className="h-4 w-16 bg-neutral-800 rounded" />
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="mb-6 p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-lg">
        <div className="h-3 w-24 bg-blue-800/50 rounded mx-auto mb-2" />
        <div className="h-8 w-24 bg-blue-800/50 rounded mx-auto" />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="h-12 bg-blue-600/50 rounded-lg" />
        <div className="h-12 bg-neutral-700 rounded-lg" />
        <div className="h-12 bg-neutral-700 rounded-lg" />
      </div>
    </div>
  );
}

interface ProfileTableSkeletonProps {
  title: string;
  rows?: number;
}

export function ProfileTableSkeleton({
  title,
  rows = 3,
}: ProfileTableSkeletonProps) {
  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden p-2 max-sm:bg-neutral-800 animate-pulse">
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">{title}</h3>
        <div className="h-4 w-20 bg-neutral-700 rounded" />
      </div>

      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`p-4 flex items-center justify-between ${
              i % 2 === 0 ? "bg-neutral-800" : "bg-neutral-700/50"
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-32 bg-neutral-700 rounded" />
                  <div className="h-5 w-12 bg-emerald-500/20 rounded-full" />
                </div>
                <div className="h-3 w-20 bg-neutral-700/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventsPromoSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden animate-pulse">
      <div className="p-4 border-b border-blue-700/30">
        <div className="h-6 w-40 bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-56 bg-neutral-800/50 rounded" />
      </div>

      <div className="p-4 space-y-3">
        {[1, 2].map(i => (
          <div
            key={i}
            className="flex gap-4 p-3 bg-neutral-900/50 rounded-lg"
          >
            <div className="w-16 h-16 flex-shrink-0 rounded-md bg-neutral-800" />
            <div className="flex-1 min-w-0">
              <div className="h-5 w-36 bg-neutral-800 rounded mb-2" />
              <div className="h-4 w-28 bg-neutral-800/50 rounded mb-2" />
              <div className="h-5 w-24 bg-green-400/10 rounded" />
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileEventsAttendedSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-lg overflow-hidden p-2 max-sm:bg-neutral-800 animate-pulse">
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">Events Attended</h3>
        <div className="h-4 w-16 bg-neutral-700 rounded" />
      </div>

      <div className="p-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-32 flex-shrink-0">
              <div className="aspect-square rounded-lg bg-neutral-800 mb-2" />
              <div className="h-4 w-24 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Back link skeleton used in subpages
export function BackLinkSkeleton() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-5 w-32 bg-neutral-800 rounded" />
    </div>
  );
}

// Transaction detail page skeleton
export function TransactionDetailSkeleton() {
  return (
    <div className="max-w-lg mx-auto animate-pulse">
      <div className="bg-neutral-950 rounded-lg p-6 space-y-6">
        {/* Amount */}
        <div className="text-center">
          <div className="h-10 w-32 bg-neutral-800 rounded mx-auto mb-3" />
          <div className="h-7 w-24 bg-neutral-800 rounded-full mx-auto" />
        </div>

        {/* Details */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-20 bg-neutral-800 rounded" />
              <div className="h-4 w-32 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order detail page skeleton
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-neutral-800 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="h-4 w-48 bg-neutral-700 rounded mb-2" />
            <div className="h-4 w-32 bg-neutral-700/70 rounded" />
          </div>
          <div className="h-7 w-16 bg-neutral-700 rounded-full" />
        </div>
      </div>

      {/* Items */}
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-700">
          <div className="h-6 w-24 bg-neutral-700 rounded" />
        </div>
        <div className="divide-y divide-neutral-700">
          {[1, 2].map(i => (
            <div key={i} className="p-4 flex justify-between items-center">
              <div>
                <div className="h-5 w-32 bg-neutral-700 rounded mb-2" />
                <div className="h-4 w-16 bg-neutral-700/70 rounded" />
              </div>
              <div className="h-5 w-16 bg-neutral-700 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-neutral-950 rounded-lg p-6 space-y-3">
        <div className="h-6 w-20 bg-neutral-800 rounded mb-4" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-20 bg-neutral-800 rounded" />
            <div className="h-4 w-16 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Ticket detail page skeleton
export function TicketDetailSkeleton() {
  return (
    <div className="max-w-lg mx-auto animate-pulse">
      {/* QR Code Section */}
      <div className="bg-neutral-950 rounded-lg p-6 mb-6">
        {/* Ticket ID */}
        <div className="text-center mb-6">
          <div className="h-10 w-40 bg-neutral-800 rounded mx-auto mb-2" />
          <div className="h-4 w-56 bg-neutral-800/50 rounded mx-auto" />
        </div>

        {/* Status Badge */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="h-7 w-24 bg-emerald-500/20 rounded-full" />
        </div>

        {/* QR Code placeholder */}
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-xl mb-4">
            <div className="w-[280px] h-[280px] bg-neutral-200 rounded" />
          </div>
          <div className="h-3 w-48 bg-neutral-800/70 rounded mb-2" />
          <div className="h-4 w-32 bg-neutral-800/50 rounded" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        <div className="h-12 bg-blue-600/50 rounded-lg" />
        <div className="h-12 bg-black/50 border border-neutral-700 rounded-lg" />
      </div>

      {/* Event Info Card */}
      <div className="bg-neutral-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-neutral-700 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-5 w-40 bg-neutral-700 rounded mb-2" />
            <div className="h-4 w-28 bg-neutral-700/70 rounded" />
          </div>
          <div className="w-5 h-5 bg-neutral-700 rounded" />
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-3 mb-6">
        <div className="h-6 w-32 bg-neutral-800 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-neutral-800 rounded" />
              <div className="h-4 w-32 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Admin Skeletons (white/gray theme)
// =============================================================================

interface AdminPageHeaderSkeletonProps {
  title: string;
  subtitle?: string;
}

export function AdminPageHeaderSkeleton({ title, subtitle }: AdminPageHeaderSkeletonProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

interface AdminStatsSkeletonProps {
  count?: number;
}

const statsGridClasses: Record<number, string> = {
  2: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6",
  3: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6",
  4: "grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6",
  5: "grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6",
  6: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6",
};

export function AdminStatsSkeleton({ count = 3 }: AdminStatsSkeletonProps) {
  const gridClass = statsGridClasses[count] || statsGridClasses[3];

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      {/* Search/Filter bar */}
      <div className="p-4 border-b border-gray-200 flex gap-4">
        <div className="h-10 flex-1 max-w-md bg-gray-100 rounded" />
        <div className="h-10 w-32 bg-gray-100 rounded" />
      </div>

      {/* Table header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 w-24 bg-gray-200 rounded" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-4 border-b border-gray-100 flex items-center gap-4"
        >
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AdminBackLinkSkeleton() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-5 w-28 bg-gray-200 rounded" />
    </div>
  );
}

export function AdminDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200" />
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="p-6 space-y-8">
        {[1, 2, 3].map(section => (
          <div key={section}>
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {[1, 2, 3].map(row => (
                <div key={row} className="flex justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
      <div className="px-4 py-5 sm:px-6">
        <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-56 bg-gray-100 rounded" />
      </div>
      <div className="border-t border-gray-200 px-4 py-5">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between py-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-48 bg-gray-200 rounded" />
      </div>
      <div className="p-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ))}
        <div className="pt-4">
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

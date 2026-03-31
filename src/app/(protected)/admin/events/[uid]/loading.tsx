import {
  AdminBackLinkSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminEventDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />

      {/* Event header card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 animate-pulse">
        <div className="flex gap-6 items-start">
          <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
            <div className="h-5 w-48 bg-gray-100 rounded mb-1" />
            <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
            <div className="h-3 w-56 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Tickets table */}
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

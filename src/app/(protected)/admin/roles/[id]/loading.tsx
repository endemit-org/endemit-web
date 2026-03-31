import {
  AdminBackLinkSkeleton,
  AdminFormSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminRoleDetailLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <div className="mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-blue-100 rounded-full" />
        </div>
        <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
      </div>
      <AdminFormSkeleton />
    </div>
  );
}

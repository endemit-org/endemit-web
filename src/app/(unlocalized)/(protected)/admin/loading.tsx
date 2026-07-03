import { AdminDashboardSkeleton } from "@/app/_components/ui/Skeletons";

export default function AdminDashboardLoading() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <AdminDashboardSkeleton />
    </div>
  );
}

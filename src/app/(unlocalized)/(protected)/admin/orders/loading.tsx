import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminOrdersLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Orders"
        subtitle="View and manage all orders in the system"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

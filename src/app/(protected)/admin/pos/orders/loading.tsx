import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminPosOrdersLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="POS Orders"
        subtitle="View and manage all POS orders"
      />
      <AdminStatsSkeleton count={5} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

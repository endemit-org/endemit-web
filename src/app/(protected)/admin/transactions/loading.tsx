import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminTransactionsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Transactions"
        subtitle="View all wallet transactions across the system"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

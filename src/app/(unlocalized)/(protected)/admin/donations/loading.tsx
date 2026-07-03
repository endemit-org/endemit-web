import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminDonationsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Donations"
        subtitle="View all donations from completed orders"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

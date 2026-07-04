import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminWalletsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Wallets"
        subtitle="View and manage user wallet balances"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

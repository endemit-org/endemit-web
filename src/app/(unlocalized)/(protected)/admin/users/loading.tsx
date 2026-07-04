import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminUsersLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Users"
        subtitle="View and manage all users in the system"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={10} />
    </div>
  );
}

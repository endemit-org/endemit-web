import {
  AdminPageHeaderSkeleton,
  AdminStatsSkeleton,
  AdminTableSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminRolesLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton
        title="Roles"
        subtitle="Manage roles and their permissions"
      />
      <AdminStatsSkeleton count={3} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}

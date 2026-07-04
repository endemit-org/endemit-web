import {
  AdminBackLinkSkeleton,
  AdminFormSkeleton,
} from "@/app/_components/ui/Skeletons";

export default function AdminNewRoleLoading() {
  return (
    <div>
      <AdminBackLinkSkeleton />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define a new role with specific permissions
        </p>
      </div>
      <AdminFormSkeleton />
    </div>
  );
}

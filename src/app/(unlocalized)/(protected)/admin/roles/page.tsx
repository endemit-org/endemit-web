import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchRoles } from "@/domain/role/actions/fetchRolesAction";
import { getRoleStats } from "@/domain/role/operations/getRoleStats";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import RolesDisplay from "@/app/_components/admin/RolesDisplay";

export const metadata: Metadata = {
  title: "Roles  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRolesPage() {
  const user = await getCurrentUser();

  if (!user?.permissions.includes(PERMISSIONS.ROLES_READ)) {
    redirect("/admin");
  }

  const [roles, stats] = await Promise.all([
    fetchRoles(),
    getRoleStats(),
  ]);
  const canCreate = user.permissions.includes(PERMISSIONS.ROLES_CREATE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage roles and their permissions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Roles</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.totalRoles.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">System Roles</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.systemRoles.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Users with Roles</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.usersWithRoles.toLocaleString()}
          </div>
        </div>
      </div>

      <RolesDisplay initialData={roles} canCreate={canCreate} />
    </div>
  );
}

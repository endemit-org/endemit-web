import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fetchRoles } from "@/domain/role/actions/fetchRolesAction";
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

  const roles = await fetchRoles();
  const canCreate = user.permissions.includes(PERMISSIONS.ROLES_CREATE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage roles and their permissions
        </p>
      </div>
      <RolesDisplay initialData={roles} canCreate={canCreate} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { fetchRoleById } from "@/domain/role/actions/fetchRoleByIdAction";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import RoleEditForm from "@/app/_components/admin/RoleEditForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await fetchRoleById(id);

  return {
    title: role ? `${role.name}  •  Roles  •  Admin` : "Role Not Found",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminRoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user?.permissions.includes(PERMISSIONS.ROLES_READ)) {
    redirect("/admin");
  }

  const { id } = await params;
  const role = await fetchRoleById(id);

  if (!role) {
    notFound();
  }

  const canUpdate = user.permissions.includes(PERMISSIONS.ROLES_UPDATE);
  const canDelete = user.permissions.includes(PERMISSIONS.ROLES_DELETE);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/roles"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Roles
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
          {role.isSystem && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              System Role
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {role.userCount} user{role.userCount !== 1 ? "s" : ""} assigned to this role
        </p>
      </div>

      <RoleEditForm role={role} canUpdate={canUpdate} canDelete={canDelete} />
    </div>
  );
}

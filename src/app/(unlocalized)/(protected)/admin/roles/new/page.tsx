import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import RoleEditForm from "@/app/_components/admin/RoleEditForm";

export const metadata = {
  title: "Create Role  •  Roles  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewRolePage() {
  const user = await getCurrentUser();

  if (!user?.permissions.includes(PERMISSIONS.ROLES_CREATE)) {
    redirect("/admin/roles");
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define a new role with specific permissions
        </p>
      </div>

      <RoleEditForm canUpdate={true} canDelete={false} />
    </div>
  );
}

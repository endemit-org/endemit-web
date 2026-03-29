import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUserById } from "@/domain/user/operations/getUserById";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatDateTime } from "@/lib/util/formatting";
import UserEditForm from "@/app/_components/admin/UserEditForm";
import UserPasswordForm from "@/app/_components/admin/UserPasswordForm";
import UserRolesManager from "@/app/_components/admin/UserRolesManager";
import UserSessionsTable from "@/app/_components/admin/UserSessionsTable";
import clsx from "clsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  return {
    title: user
      ? `${user.username}  •  Users  •  Admin`
      : "User Not Found  •  Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-yellow-100 text-yellow-800",
  BANNED: "bg-red-100 text-red-800",
  PENDING_VERIFICATION: "bg-blue-100 text-blue-800",
  DELETED: "bg-gray-100 text-gray-800",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  // Permission check - must have USERS_READ to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.USERS_READ)) {
    redirect("/admin");
  }

  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  const canUpdate = currentUser.permissions.includes(PERMISSIONS.USERS_UPDATE);
  const canManageRoles = currentUser.permissions.includes(
    PERMISSIONS.USERS_MANAGE_ROLES
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
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
          Back to Users
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {user.username}
              </h1>
              {user.email && (
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              )}
            </div>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-sm font-medium self-start",
                statusColors[user.status] || "bg-gray-100 text-gray-800"
              )}
            >
              {user.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* User Info */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              User Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDateTime(new Date(user.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span>
                  {user.lastLoginAt
                    ? formatDateTime(new Date(user.lastLoginAt))
                    : "Never"}
                </span>
              </div>
            </div>
          </section>

          {/* Edit User */}
          {canUpdate && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Edit User
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <UserEditForm user={user} />
              </div>
            </section>
          )}

          {/* Set Password */}
          {canUpdate && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Set New Password
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <UserPasswordForm userId={user.id} />
              </div>
            </section>
          )}

          {/* Roles */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Roles
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <UserRolesManager
                userId={user.id}
                currentRoles={user.roles}
                canManageRoles={!!canManageRoles}
              />
            </div>
          </section>

          {/* Sessions */}
          {canUpdate && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Active Sessions ({user.sessions.length})
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <UserSessionsTable userId={user.id} sessions={user.sessions} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

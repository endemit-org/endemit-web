import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserById } from "@/domain/user/operations/getUserById";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { getAllRoles } from "@/domain/role/operations/getAllRoles";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
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
  const canViewWallets = currentUser.permissions.includes(PERMISSIONS.WALLETS_READ);

  const [wallet, allRoles] = await Promise.all([
    canViewWallets ? getWalletByUserId(id) : null,
    canManageRoles ? getAllRoles() : [],
  ]);

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
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={`${user.username}'s avatar`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.username}
                </h1>
                {user.email && (
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  statusColors[user.status] || "bg-gray-100 text-gray-800"
                )}
              >
                {user.status}
              </span>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  user.signInType === "PASSWORD"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-indigo-100 text-indigo-800"
                )}
              >
                {user.signInType === "PASSWORD" ? "Password" : "Magic Link"}
              </span>
            </div>
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

          {/* Wallet */}
          {canViewWallets && wallet && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Wallet
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Balance</div>
                    <div
                      className={clsx(
                        "text-2xl font-bold",
                        wallet.balance > 0
                          ? "text-green-600"
                          : wallet.balance < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      )}
                    >
                      {formatCurrency(wallet.balance / 100)}
                    </div>
                  </div>
                  <Link
                    href={`/admin/wallets/${wallet.id}`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                  >
                    Manage Wallet
                  </Link>
                </div>
              </div>
            </section>
          )}

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

          {/* Set Password - only for PASSWORD auth type users */}
          {canUpdate && user.signInType === "PASSWORD" && (
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
                allRoles={allRoles}
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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAllUsers } from "@/domain/user/operations/getAllUsers";
import { getUserStats } from "@/domain/user/operations/getUserStats";
import UsersDisplay from "@/app/_components/admin/UsersDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export const metadata: Metadata = {
  title: "Users  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  // Permission check - must have USERS_READ to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.USERS_READ)) {
    redirect("/admin");
  }

  const [initialData, stats] = await Promise.all([
    getAllUsers(),
    getUserStats(),
  ]);

  const canCreateUsers = currentUser.permissions.includes(
    PERMISSIONS.USERS_CREATE
  );

  const t = await getTranslations("admin.users");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("page.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("page.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("page.statTotal")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("page.statActive")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.activeUsers.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">
            {t("page.statNewThisMonth")}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.newUsersThisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      <UsersDisplay initialData={initialData} canCreateUsers={canCreateUsers} />
    </div>
  );
}

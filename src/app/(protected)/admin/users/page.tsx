import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/domain/user/operations/getAllUsers";
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

  const initialData = await getAllUsers();

  const canCreateUsers = currentUser.permissions.includes(
    PERMISSIONS.USERS_CREATE
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all users in the system
        </p>
      </div>
      <UsersDisplay initialData={initialData} canCreateUsers={canCreateUsers} />
    </div>
  );
}

import type { Metadata } from "next";
import { getAllUsers } from "@/domain/user/operations/getAllUsers";
import UsersDisplay from "@/app/_components/admin/UsersDisplay";

export const metadata: Metadata = {
  title: "Users  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUsersPage() {
  const initialData = await getAllUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all users in the system
        </p>
      </div>
      <UsersDisplay initialData={initialData} />
    </div>
  );
}

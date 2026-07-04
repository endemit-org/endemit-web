import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllPosItems } from "@/domain/pos/operations/getAllPosItems";
import PosItemsDisplay from "@/app/_components/admin/PosItemsDisplay";

export const metadata: Metadata = {
  title: "POS Items  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPosItemsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.POS_ITEMS_READ)) {
    redirect("/admin");
  }

  const { items } = await getAllPosItems();
  const canWrite = currentUser.permissions.includes(PERMISSIONS.POS_ITEMS_WRITE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">POS Items</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage items available for sale at POS registers
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Items</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.filter(i => i.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Inactive</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {items.filter(i => i.status === "INACTIVE").length}
          </div>
        </div>
      </div>

      <PosItemsDisplay initialItems={items} canWrite={canWrite} />
    </div>
  );
}

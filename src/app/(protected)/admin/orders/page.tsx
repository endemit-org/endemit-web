import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import OrdersDisplay from "@/app/_components/admin/OrdersDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export const metadata: Metadata = {
  title: "Orders  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOrdersPage() {
  const currentUser = await getCurrentUser();

  // Permission check - must have ORDERS_READ_ALL to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.ORDERS_READ_ALL)) {
    redirect("/admin");
  }

  const initialData = await getAllOrders();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all orders in the system
        </p>
      </div>
      <OrdersDisplay initialData={initialData} />
    </div>
  );
}

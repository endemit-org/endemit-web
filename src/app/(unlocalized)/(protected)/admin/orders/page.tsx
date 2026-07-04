import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import { getOrderStats } from "@/domain/order/operations/getOrderStats";
import OrdersDisplay from "@/app/_components/admin/OrdersDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatCurrency } from "@/lib/util/formatting";

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

  const [initialData, stats] = await Promise.all([
    getAllOrders(),
    getOrderStats(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all orders in the system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Paid Orders</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.orderCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.pendingCount.toLocaleString()}
          </div>
        </div>
      </div>

      <OrdersDisplay initialData={initialData} />
    </div>
  );
}

import type { Metadata } from "next";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import OrdersDisplay from "@/app/_components/admin/OrdersDisplay";

export const metadata: Metadata = {
  title: "Orders  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOrdersPage() {
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

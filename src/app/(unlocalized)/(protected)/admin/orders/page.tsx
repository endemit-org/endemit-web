import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import { getOrderStats } from "@/domain/order/operations/getOrderStats";
import OrdersDisplay from "@/app/_components/admin/OrdersDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatCurrency } from "@/lib/util/formatting";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.orders");
  return {
    title: t("page.metaTitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminOrdersPage() {
  const t = await getTranslations("admin.orders");
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
        <h1 className="text-2xl font-bold text-gray-900">{t("page.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("page.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">{t("page.stats.totalRevenue")}</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">{t("page.stats.paidOrders")}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.orderCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">{t("page.stats.pending")}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.pendingCount.toLocaleString()}
          </div>
        </div>
      </div>

      <OrdersDisplay initialData={initialData} />
    </div>
  );
}

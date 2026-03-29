import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllPosOrders } from "@/domain/pos/operations/getAllPosOrders";
import { prisma } from "@/lib/services/prisma";
import PosOrdersDisplay from "@/app/_components/admin/PosOrdersDisplay";

export const metadata: Metadata = {
  title: "POS Orders  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPosOrdersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.POS_ORDERS_READ)) {
    redirect("/admin");
  }

  const [ordersResult, registers, stats, paidOrdersWithItems] = await Promise.all([
    getAllPosOrders({ page: 1 }),
    prisma.posRegister.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.posOrder.groupBy({
      by: ["status"],
      _count: true,
      _sum: {
        tipAmount: true,
      },
    }),
    // Get paid orders with items to calculate revenue (DEBIT only) and top-ups (CREDIT)
    prisma.posOrder.findMany({
      where: { status: "PAID" },
      select: {
        items: {
          select: {
            total: true,
            item: {
              select: { direction: true },
            },
          },
        },
      },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    stats.map(s => [s.status, { count: s._count }])
  );

  // Calculate revenue (DEBIT items only) and top-ups (CREDIT items)
  let totalRevenue = 0;
  let totalTopUps = 0;
  for (const order of paidOrdersWithItems) {
    for (const item of order.items) {
      if (item.item.direction === "DEBIT") {
        totalRevenue += item.total;
      } else {
        totalTopUps += item.total;
      }
    }
  }

  const totalTips = stats
    .filter(s => s.status === "PAID")
    .reduce((sum, s) => sum + (s._sum.tipAmount ?? 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">POS Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all POS orders
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {ordersResult.totalCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Paid</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {statusCounts.PAID?.count ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {new Intl.NumberFormat("sl-SI", {
              style: "currency",
              currency: "EUR",
            }).format(totalRevenue / 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Tips</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">
            {new Intl.NumberFormat("sl-SI", {
              style: "currency",
              currency: "EUR",
            }).format(totalTips / 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Cash to Collect</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {new Intl.NumberFormat("sl-SI", {
              style: "currency",
              currency: "EUR",
            }).format(totalTopUps / 100)}
          </div>
        </div>
      </div>

      <PosOrdersDisplay
        initialOrders={ordersResult.orders}
        initialPage={ordersResult.page}
        totalPages={ordersResult.totalPages}
        totalCount={ordersResult.totalCount}
        registers={registers}
      />
    </div>
  );
}

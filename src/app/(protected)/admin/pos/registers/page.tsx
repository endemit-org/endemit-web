import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllPosRegisters } from "@/domain/pos/operations/getAllPosRegisters";
import { getAllPosItems } from "@/domain/pos/operations/getAllPosItems";
import { prisma } from "@/lib/services/prisma";
import PosRegistersDisplay from "@/app/_components/admin/PosRegistersDisplay";
import { formatTokensFromCents } from "@/lib/util/currency";

function formatPrice(cents: number): string {
  return formatTokensFromCents(cents);
}

export const metadata: Metadata = {
  title: "POS Registers  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPosRegistersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.POS_REGISTERS_READ)) {
    redirect("/admin");
  }

  const [{ registers }, { items }, usersRaw] = await Promise.all([
    getAllPosRegisters(),
    getAllPosItems(),
    prisma.user.findMany({
      where: { status: "ACTIVE", email: { not: null } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Filter users with valid emails
  const users = usersRaw.filter(
    (u): u is { id: string; name: string | null; email: string } =>
      u.email !== null
  );

  const canWrite = currentUser.permissions.includes(
    PERMISSIONS.POS_REGISTERS_WRITE
  );

  const totalTips = registers.reduce((sum, r) => sum + r.traffic.tipsCollected, 0);
  const totalOrders = registers.reduce((sum, r) => sum + r.traffic.paidOrdersCount, 0);
  const totalSales = registers.reduce((sum, r) => sum + r.traffic.salesRevenue, 0);
  const totalTopUps = registers.reduce((sum, r) => sum + r.traffic.topUpsProcessed, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">POS Registers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage registers, assign items and sellers
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Registers</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {registers.filter(r => r.status === "ACTIVE").length}/{registers.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Sales</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {totalOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Revenue</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPrice(totalSales)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Tips</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">
            {formatPrice(totalTips)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-sm font-medium text-gray-500">Cash to Collect (Top-ups)</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {formatPrice(totalTopUps)}
          </div>
        </div>
      </div>

      <PosRegistersDisplay
        initialRegisters={registers}
        allItems={items}
        allUsers={users}
        canWrite={canWrite}
      />
    </div>
  );
}

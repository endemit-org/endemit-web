import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllWallets } from "@/domain/wallet/operations/getAllWallets";
import { getWalletStats } from "@/domain/wallet/operations/getWalletStats";
import WalletsDisplay from "@/app/_components/admin/WalletsDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatTokensFromCents } from "@/lib/util/currency";

export const metadata: Metadata = {
  title: "Wallets  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminWalletsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.WALLETS_READ)) {
    redirect("/admin");
  }

  const [initialData, stats] = await Promise.all([
    getAllWallets(),
    getWalletStats(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage user wallet balances
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Balance</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {formatTokensFromCents(stats.totalBalance)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Wallets</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.walletCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Transactions</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.transactionCount.toLocaleString()}
          </div>
        </div>
      </div>

      <WalletsDisplay initialData={initialData} />
    </div>
  );
}

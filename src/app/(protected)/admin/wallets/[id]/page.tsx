import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getWalletById } from "@/domain/wallet/operations/getWalletById";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
import WalletTransactionForm from "@/app/_components/admin/WalletTransactionForm";
import WalletTransactionsTable from "@/app/_components/admin/WalletTransactionsTable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wallet = await getWalletById(id);

  return {
    title: wallet
      ? `${wallet.user?.username || "Wallet"}  •  Wallets  •  Admin`
      : "Wallet Not Found  •  Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminWalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.WALLETS_READ)) {
    redirect("/admin");
  }

  const wallet = await getWalletById(id);

  if (!wallet) {
    notFound();
  }

  const canManageBalance = currentUser.permissions.includes(
    PERMISSIONS.WALLETS_MANAGE_BALANCE
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/wallets"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Wallets
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {wallet.user?.name || wallet.user?.username || "Unknown User"}
              </h1>
              {wallet.user?.email && (
                <p className="text-sm text-gray-500 mt-1">{wallet.user.email}</p>
              )}
              <Link
                href={`/admin/users/${wallet.userId}`}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
              >
                View User Profile
              </Link>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Balance</div>
              <div
                className={`text-3xl font-bold ${
                  wallet.balance > 0
                    ? "text-green-600"
                    : wallet.balance < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {formatCurrency(wallet.balance / 100)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Wallet Info */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Wallet Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet ID:</span>
                <span className="font-mono text-sm">{wallet.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDateTime(new Date(wallet.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{formatDateTime(new Date(wallet.updatedAt))}</span>
              </div>
            </div>
          </section>

          {/* Add/Remove Balance */}
          {canManageBalance && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Manage Balance
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <WalletTransactionForm
                  walletId={wallet.id}
                  currentBalance={wallet.balance}
                />
              </div>
            </section>
          )}

          {/* Transaction History */}
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Transaction History ({wallet.transactions.length})
            </h2>
            <WalletTransactionsTable transactions={wallet.transactions} />
          </section>
        </div>
      </div>
    </div>
  );
}

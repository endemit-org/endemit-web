import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllTransactions } from "@/domain/wallet/operations/getAllTransactions";
import { getTransactionStats } from "@/domain/wallet/operations/getTransactionStats";
import TransactionsDisplay from "@/app/_components/admin/TransactionsDisplay";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { formatCurrency } from "@/lib/util/formatting";

export const metadata: Metadata = {
  title: "Transactions  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminTransactionsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.permissions.includes(PERMISSIONS.TRANSACTIONS_READ)) {
    redirect("/admin");
  }

  const [initialData, stats] = await Promise.all([
    getAllTransactions(),
    getTransactionStats(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          View all wallet transactions across the system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Credits</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            +{formatCurrency(stats.totalCredits / 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Debits</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            -{formatCurrency(stats.totalDebits / 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Transactions</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {stats.transactionCount.toLocaleString()}
          </div>
        </div>
      </div>

      <TransactionsDisplay initialData={initialData} />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getTransactionById } from "@/domain/wallet/operations/getTransactionById";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import clsx from "clsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Transaction ${id.slice(0, 8)}...`,
    description: "View transaction details",
    robots: {
      index: false,
      follow: false,
    },
  };
}

const typeLabels: Record<string, string> = {
  CREDIT: "Credit Added",
  DEBIT: "Debit",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

const typeColors: Record<string, string> = {
  CREDIT: "bg-green-500/20 text-green-400",
  PURCHASE: "bg-green-500/20 text-green-400",
  REFUND: "bg-blue-500/20 text-blue-400",
  DEBIT: "bg-red-500/20 text-red-400",
  ADJUSTMENT: "bg-yellow-500/20 text-yellow-400",
};

export default async function ProfileTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const { id } = await params;
  const transaction = await getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  // Verify the transaction belongs to this user
  if (transaction.wallet.userId !== user.id) {
    notFound();
  }

  const isPositive = transaction.amount > 0;

  return (
    <OuterPage>
      <PageHeadline
        title="Transaction Details"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Transactions", path: "transactions" },
          { label: `#${id.slice(-8)}`, path: id },
        ]}
      />

      <InnerPage>
        <div className="mb-6">
          <Link
            href="/profile/transactions"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
            Back to Transactions
          </Link>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-neutral-950 rounded-lg p-6 space-y-6">
            {/* Amount */}
            <div className="text-center">
              <div
                className={clsx(
                  "text-4xl font-bold",
                  isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {isPositive ? "+" : ""}
                {formatCurrency(transaction.amount / 100)}
              </div>
              <span
                className={clsx(
                  "inline-block mt-3 rounded-full px-3 py-1 text-sm font-medium",
                  typeColors[transaction.type] || "bg-gray-500/20 text-gray-400"
                )}
              >
                {typeLabels[transaction.type] || transaction.type}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">Date</span>
                <span className="text-neutral-200">
                  {formatDateTime(new Date(transaction.createdAt))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-400">Balance After</span>
                <span className="text-neutral-200">
                  {formatCurrency(transaction.balanceAfter / 100)}
                </span>
              </div>

              {transaction.note && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Note</span>
                  <span className="text-neutral-200 text-right max-w-[200px] break-words">
                    {transaction.note}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-400">Transaction ID</span>
                <span className="text-neutral-500 font-mono text-xs">
                  {transaction.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}

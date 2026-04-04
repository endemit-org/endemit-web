import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { formatTokensFromCents } from "@/lib/util/currency";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import WalletIcon from "@/app/_components/icon/WalletIcon";
import ProfileTable, {
  ProfileTableRow,
} from "@/app/_components/profile/ProfileTable";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Transactions",
  description: "View your cashless transaction history",
  robots: {
    index: false,
    follow: false,
  },
};

const typeLabels: Record<string, string> = {
  CREDIT: "Added",
  DEBIT: "Spent",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export default async function ProfileTransactionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const wallet = await getWalletByUserId(user.id);
  const transactions = wallet?.transactions ?? [];

  return (
    <OuterPage>
      <PageHeadline
        title="Transactions"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Transactions", path: "transactions" },
        ]}
      />

      <InnerPage>
        <div className="mb-6">
          <Link
            href="/profile"
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
            Back to Profile
          </Link>
        </div>

        <ProfileTable
          title="Transaction History"
          count={transactions.length}
          countLabel={
            transactions.length === 1 ? "transaction" : "transactions"
          }
          isEmpty={transactions.length === 0}
          emptyIcon={<WalletIcon className="w-6 h-6 text-neutral-500" />}
          emptyMessage="No transactions yet"
        >
          {transactions.map((tx, index) => {
            const formattedDate = new Date(tx.createdAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <ProfileTableRow
                key={tx.id}
                href={`/profile/transactions/${tx.id}`}
                index={index}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      tx.amount > 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {tx.amount > 0 ? "+" : "-"}
                  </div>
                  <div>
                    <div className="text-neutral-200 text-sm">
                      {typeLabels[tx.type] || tx.type}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formattedDate}
                    </div>
                  </div>
                </div>
                <div
                  className={clsx(
                    "font-semibold",
                    tx.amount > 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {formatTokensFromCents(tx.amount)}
                </div>
              </ProfileTableRow>
            );
          })}
        </ProfileTable>
      </InnerPage>
    </OuterPage>
  );
}

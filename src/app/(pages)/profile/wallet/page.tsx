import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import WalletBalance from "@/app/_components/profile/WalletBalance";
import WalletTransactionList from "@/app/_components/profile/WalletTransactionList";

export const metadata: Metadata = {
  title: "My Wallet",
  description: "View your wallet balance and transaction history",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WalletPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const wallet = await getWalletByUserId(user.id);

  return (
    <OuterPage>
      <PageHeadline
        title="My Wallet"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Profile", path: "profile" },
          { label: "Wallet", path: "profile/wallet" },
        ]}
      />

      <InnerPage>
        <div className="max-w-2xl mx-auto space-y-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors"
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

          {/* Balance Card */}
          <WalletBalance balance={wallet?.balance ?? 0} />

          {/* Transaction History */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-200 mb-4">
              Transaction History
            </h2>
            <WalletTransactionList transactions={wallet?.transactions ?? []} />
          </section>
        </div>
      </InnerPage>
    </OuterPage>
  );
}

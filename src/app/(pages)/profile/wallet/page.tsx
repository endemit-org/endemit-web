import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import WalletDisplay from "@/app/_components/profile/WalletDisplay";

export const metadata: Metadata = {
  title: "Wallet",
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
        title="Wallet"
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

          <WalletDisplay
            userId={user.id}
            initialBalance={wallet?.balance ?? 0}
            initialTransactions={wallet?.transactions ?? []}
          />
        </div>
      </InnerPage>
    </OuterPage>
  );
}

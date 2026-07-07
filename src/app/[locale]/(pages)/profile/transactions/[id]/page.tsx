import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getTransactionById } from "@/domain/wallet/operations/getTransactionById";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import SendToUserButton from "@/app/_components/wallet/SendToUserButton";
import { formatDateTime } from "@/lib/util/formatting";
import { formatTokensFromCents } from "@/lib/util/currency";
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

const typeLabelKeys: Record<string, string> = {
  CREDIT: "transactions.typeLong.credit",
  DEBIT: "transactions.typeLong.debit",
  PURCHASE: "transactions.typeLong.purchase",
  REFUND: "transactions.typeLong.refund",
  ADJUSTMENT: "transactions.typeLong.adjustment",
  P2P_TRANSFER: "transactions.typeLong.transfer",
};

const typeColors: Record<string, string> = {
  CREDIT: "bg-green-500/20 text-green-400",
  PURCHASE: "bg-green-500/20 text-green-400",
  REFUND: "bg-blue-500/20 text-blue-400",
  DEBIT: "bg-red-500/20 text-red-400",
  ADJUSTMENT: "bg-yellow-500/20 text-yellow-400",
  P2P_TRANSFER: "bg-blue-500/20 text-blue-400",
};

export default async function ProfileTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const transaction = await getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  // Verify the transaction belongs to this user
  if (transaction.wallet.userId !== user.id) {
    notFound();
  }

  const isPositive = transaction.amount > 0;
  const isTransfer = transaction.type === "P2P_TRANSFER";
  const counterparty = transaction.counterparty;
  const counterpartyLabel = counterparty
    ? counterparty.name || counterparty.username
    : null;

  // Current balance for the "send tokens again" shortcut.
  const wallet = counterparty ? await getWalletByUserId(user.id) : null;

  return (
    <OuterPage>
      <PageHeadline
        title={t("transactions.detailTitle")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.transactions"), path: "transactions" },
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
            {t("nav.backToTransactions")}
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
                {formatTokensFromCents(transaction.amount)}
              </div>
              <span
                className={clsx(
                  "inline-block mt-3 rounded-full px-3 py-1 text-sm font-medium",
                  typeColors[transaction.type] || "bg-gray-500/20 text-gray-400"
                )}
              >
                {typeLabelKeys[transaction.type]
                  ? t(
                      typeLabelKeys[
                        transaction.type
                      ] as Parameters<typeof t>[0]
                    )
                  : transaction.type}
              </span>
            </div>

            {isTransfer && counterparty && counterpartyLabel && (
              <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800">
                <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {counterparty.image ? (
                    <Image
                      src={counterparty.image}
                      alt={counterpartyLabel}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {counterpartyLabel
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-widest text-neutral-500">
                    {isPositive ? t("transactions.from") : t("transactions.to")}
                  </p>
                  <p className="text-neutral-200 font-medium truncate">
                    {counterpartyLabel}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {counterparty.username}
                  </p>
                </div>
                </div>
                <div className="mt-3">
                  <SendToUserButton
                    recipient={counterparty}
                    senderBalance={wallet?.balance ?? 0}
                  />
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">{t("transactions.date")}</span>
                <span className="text-neutral-200">
                  {formatDateTime(new Date(transaction.createdAt))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-400">{t("transactions.balanceAfter")}</span>
                <span className="text-neutral-200">
                  {formatTokensFromCents(transaction.balanceAfter)}
                </span>
              </div>

              {transaction.note && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t("transactions.note")}</span>
                  <span className="text-neutral-200 text-right max-w-[200px] break-words">
                    {transaction.note}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-400">{t("transactions.transactionId")}</span>
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

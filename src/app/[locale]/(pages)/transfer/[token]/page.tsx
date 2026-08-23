import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketTransferByToken } from "@/domain/ticket/operations/ticketTransfers";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import TransferAcceptButton from "@/app/_components/profile/TransferAcceptButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TicketTransferAcceptPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile.ticketTransfer");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/transfer/${token}`)}`);
  }

  const transfer = await getTicketTransferByToken(token);
  if (!transfer) {
    notFound();
  }

  const formattedExpiry = transfer.expiresAt.toLocaleString(
    locale === "en" ? "en-GB" : "sl-SI",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <OuterPage>
      <PageHeadline
        title={t("acceptTitle")}
        segments={[{ label: "Endemit", path: "" }]}
      />
      <InnerPage>
        <div className="max-w-lg mx-auto bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-center">
          {transfer.status === "PENDING" ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">
                {t("offerHeading", { event: transfer.eventName })}
              </h2>
              <p className="text-neutral-400 mb-2">
                {t("offerFrom", { sender: transfer.senderName })}
              </p>
              <p className="text-xs text-neutral-500 mb-6">
                {t("offerExpiry", { date: formattedExpiry })}
              </p>
              <div className="flex justify-center">
                <TransferAcceptButton token={token} />
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                {t("acceptNote")}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">
                {transfer.status === "ACCEPTED"
                  ? t("alreadyAccepted")
                  : transfer.status === "REVOKED"
                    ? t("revoked")
                    : t("expired")}
              </h2>
              <p className="text-neutral-400">
                {t("closedNote", { event: transfer.eventName })}
              </p>
            </>
          )}
        </div>
      </InnerPage>
    </OuterPage>
  );
}

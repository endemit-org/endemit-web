import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import {
  getIncomingTicketTransfers,
  getOutgoingTicketTransfers,
} from "@/domain/ticket/operations/ticketTransfers";
import TransferAcceptButton from "@/app/_components/profile/TransferAcceptButton";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import ProfileTable, {
  ProfileTableRow,
} from "@/app/_components/profile/ProfileTable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "profile" });
  return {
    title: t("meta.tickets.title"),
    description: t("meta.tickets.description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

const statusColors: Record<string, string> = {
  VALIDATED: "bg-emerald-500/20 text-emerald-400",
  PENDING: "bg-emerald-500/20 text-emerald-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
};

const statusLabelKeys: Record<string, string> = {
  VALIDATED: "status.ticket.ready",
  PENDING: "status.ticket.ready",
  SCANNED: "status.ticket.used",
  CANCELLED: "status.ticket.cancelled",
  BANNED: "status.ticket.banned",
};

export default async function ProfileTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const [tickets, incomingTransfers, outgoingTransfers] = await Promise.all([
    getTicketsByUserId(user.id, { upcomingOnly: true }),
    user.email ? getIncomingTicketTransfers(user.email) : Promise.resolve([]),
    getOutgoingTicketTransfers(user.id),
  ]);
  const pendingByTicketId = new Map(
    outgoingTransfers.map(transfer => [transfer.ticketId, transfer])
  );

  return (
    <OuterPage>
      <PageHeadline
        title={t("breadcrumb.tickets")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.tickets"), path: "tickets" },
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
            {t("nav.backToProfile")}
          </Link>
        </div>

        {incomingTransfers.length > 0 && (
          <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-blue-300 mb-3">
              {t("ticketTransfer.incomingHeading")}
            </h2>
            <div className="space-y-3">
              {incomingTransfers.map(transfer => (
                <div
                  key={transfer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 rounded-lg p-3"
                >
                  <div>
                    <div className="text-neutral-200 font-medium">
                      {transfer.ticket.eventName}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {t("ticketTransfer.incomingFrom", {
                        sender:
                          transfer.sender.name || transfer.sender.username,
                      })}
                    </div>
                  </div>
                  <TransferAcceptButton transferId={transfer.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        <ProfileTable
          title={t("tickets.upcomingTitle")}
          count={tickets.length}
          countLabel={t("tickets.countLabel", { count: tickets.length })}
          isEmpty={tickets.length === 0}
          emptyIcon={<TicketOutlineIcon className="w-6 h-6 text-neutral-500" />}
          emptyMessage={t("tickets.empty")}
          emptyAction={{ label: t("tickets.browseEvents"), href: "/events" }}
        >
          {tickets.map((ticket, index) => {
            const isUsable =
              ticket.status === "VALIDATED" || ticket.status === "PENDING";

            return (
              <ProfileTableRow
                key={ticket.id}
                href={`/profile/tickets/${ticket.shortId}`}
                index={index}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <TicketOutlineIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-200 font-medium truncate">
                        {ticket.eventName} – {ticket.ticketHolderName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[ticket.status] || "bg-gray-500/20 text-gray-400"}`}
                      >
                        {statusLabelKeys[ticket.status]
                          ? t(
                              statusLabelKeys[
                                ticket.status
                              ] as Parameters<typeof t>[0]
                            )
                          : ticket.status}
                      </span>
                      {ticket.isGuestList && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-purple-500/20 text-purple-400">
                          {t("status.guest")}
                        </span>
                      )}
                      {pendingByTicketId.has(ticket.id) && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-400">
                          {t("ticketTransfer.pendingBadge")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono">
                      {ticket.shortId}
                    </div>
                  </div>
                </div>
                {isUsable && (
                  <div className="ml-4 text-sm text-blue-400 flex-shrink-0">
                    {t("tickets.view")}
                  </div>
                )}
              </ProfileTableRow>
            );
          })}
        </ProfileTable>
      </InnerPage>
    </OuterPage>
  );
}

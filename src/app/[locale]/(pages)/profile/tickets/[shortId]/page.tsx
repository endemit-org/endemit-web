import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketByShortId } from "@/domain/ticket/operations/getTicketByShortId";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import TicketContent from "@/app/_components/profile/TicketContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string; locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "sl" | "en", namespace: "profile" });
  return {
    title: t("meta.ticket.title"),
    description: t("meta.ticket.description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface ProfileTicketPageProps {
  params: Promise<{ shortId: string; locale: string }>;
}

export default async function ProfileTicketPage({
  params,
}: ProfileTicketPageProps) {
  const { shortId, locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const t = await getTranslations("profile");
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const ticket = await getTicketByShortId(shortId);

  if (!ticket) {
    notFound();
  }

  // Verify ownership
  const isOwner =
    ticket.order.userId === user.id ||
    ticket.order.email === user.email ||
    ticket.ticketPayerEmail === user.email;

  if (!isOwner) {
    notFound();
  }

  // Fetch event details for date/venue
  const event = await fetchEventFromCmsById(ticket.eventId);

  // Implied expiry: prevent scanning past-event tickets even if DB status is still PENDING.
  //  - Missing event in CMS → treat as expired (we can't verify validity).
  //  - date_end present → expire 8h after end (covers late-night closeout).
  //  - only date_start → expire 24h after start (typical festival night length).
  //  - no dates at all → don't expire.
  const POST_END_BUFFER_MS = 8 * 60 * 60 * 1000;
  const POST_START_FALLBACK_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  let isEventPassed: boolean;
  if (!event) {
    isEventPassed = true;
  } else if (event.date_end) {
    isEventPassed = now > new Date(event.date_end).getTime() + POST_END_BUFFER_MS;
  } else if (event.date_start) {
    isEventPassed =
      now > new Date(event.date_start).getTime() + POST_START_FALLBACK_MS;
  } else {
    isEventPassed = false;
  }

  // Get initial scannedAt from ScanLog
  const initialScannedAt =
    ticket.ScanLog.length > 0
      ? ticket.ScanLog[0].createdAt.toISOString()
      : null;

  return (
    <OuterPage>
      <PageHeadline
        title={t("tickets.detailTitle", { shortId })}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.myProfile"), path: "profile" },
          { label: t("breadcrumb.tickets"), path: "tickets" },
          { label: shortId, path: shortId },
        ]}
      />

      <InnerPage>
        <div className="mb-6">
          <Link
            href="/profile/tickets"
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
            {t("nav.backToTickets")}
          </Link>
        </div>

        <TicketContent
          ticket={{
            shortId: ticket.shortId,
            ticketHash: ticket.ticketHash,
            eventName: ticket.eventName,
            ticketHolderName: ticket.ticketHolderName,
            ticketPayerEmail: ticket.ticketPayerEmail,
            price: ticket.price.toString(),
            status: ticket.status,
            scanCount: ticket.scanCount,
            qrContent: ticket.qrContent,
            isGuestList: ticket.isGuestList,
          }}
          event={
            event
              ? {
                  uid: event.uid,
                  name: event.name,
                  date_start: event.date_start,
                  venue: event.venue ? { name: event.venue.name } : null,
                  promoImage: event.promoImage,
                }
              : null
          }
          initialScannedAt={initialScannedAt}
          formattedEventDate={
            event?.date_start
              ? formatEventDateAndTime(
                  event.date_start,
                  locale === "en" ? "en" : "sl"
                )
              : null
          }
          isEventPassed={isEventPassed}
        />
      </InnerPage>
    </OuterPage>
  );
}

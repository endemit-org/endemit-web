import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getTicketByShortId } from "@/domain/ticket/operations/getTicketByShortId";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import TicketContent from "@/app/_components/profile/TicketContent";

export const metadata: Metadata = {
  title: "Ticket",
  description: "View your ticket",
  robots: {
    index: false,
    follow: false,
  },
};

interface ProfileTicketPageProps {
  params: Promise<{ shortId: string }>;
}

export default async function ProfileTicketPage({
  params,
}: ProfileTicketPageProps) {
  const { shortId } = await params;
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

  // Get initial scannedAt from ScanLog
  const initialScannedAt =
    ticket.ScanLog.length > 0
      ? ticket.ScanLog[0].createdAt.toISOString()
      : null;

  return (
    <OuterPage>
      <PageHeadline
        title={`Ticket ${shortId}`}
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Tickets", path: "tickets" },
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
            Back to Tickets
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
            event?.date_start ? formatEventDateAndTime(event.date_start) : null
          }
        />
      </InnerPage>
    </OuterPage>
  );
}

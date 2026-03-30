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
import ProfileTicketQrCode from "@/app/_components/profile/ProfileTicketQrCode";
import ProfileTicketDownloadButton from "@/app/_components/profile/ProfileTicketDownloadButton";

export const metadata: Metadata = {
  title: "Ticket",
  description: "View your ticket",
  robots: {
    index: false,
    follow: false,
  },
};

const statusColors: Record<string, string> = {
  VALIDATED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
  REFUND_REQUESTED: "bg-orange-500/20 text-orange-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
};

const statusLabels: Record<string, string> = {
  VALIDATED: "Valid",
  PENDING: "Valid",
  SCANNED: "Used",
  CANCELLED: "Cancelled",
  BANNED: "Banned",
  REFUND_REQUESTED: "Refund Requested",
  REFUNDED: "Refunded",
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

  const isUsable = ticket.status === "VALIDATED" || ticket.status === "PENDING";
  const qrData = ticket.qrContent
    ? JSON.stringify(ticket.qrContent)
    : ticket.ticketHash;

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

        <div className="max-w-lg mx-auto">
          {/* QR Code Section */}
          <div className="bg-neutral-950 rounded-lg p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-200 mb-1">
                {ticket.eventName}
              </h2>
              {event?.date_start && (
                <p className="text-sm text-neutral-400">
                  {formatEventDateAndTime(event.date_start)}
                </p>
              )}
              {event?.venue?.name && (
                <p className="text-sm text-neutral-500">{event.venue.name}</p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span
                className={`text-sm px-3 py-1 rounded-full ${statusColors[ticket.status] || "bg-gray-500/20 text-gray-400"}`}
              >
                {statusLabels[ticket.status] || ticket.status}
              </span>
            </div>

            {/* QR Code */}
            {isUsable ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-4">
                  <ProfileTicketQrCode qrData={qrData} size={280} />
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  Show this QR code at the entrance
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center">
                  {ticket.status === "SCANNED" ? (
                    <svg
                      className="w-8 h-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-neutral-400">
                  {ticket.status === "SCANNED"
                    ? "This ticket has already been used"
                    : "This ticket is no longer valid"}
                </p>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="bg-neutral-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-200 mb-4">
              Ticket Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-400">Ticket ID</span>
                <span className="text-neutral-200 font-mono">
                  {ticket.shortId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Holder Name</span>
                <span className="text-neutral-200">
                  {ticket.ticketHolderName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Email</span>
                <span className="text-neutral-200">
                  {ticket.ticketPayerEmail}
                </span>
              </div>
              {ticket.scanCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Times Scanned</span>
                  <span className="text-neutral-200">{ticket.scanCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          {isUsable && (
            <ProfileTicketDownloadButton
              shortId={ticket.shortId}
              holderName={ticket.ticketHolderName}
            />
          )}
        </div>
      </InnerPage>
    </OuterPage>
  );
}

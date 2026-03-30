"use client";

import Link from "next/link";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import ProfileTable, { ProfileTableRowDiv } from "./ProfileTable";

interface ProfileTicketsPreviewProps {
  tickets: SerializedTicket[];
  totalCount: number;
}

const statusColors: Record<string, string> = {
  VALIDATED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
};

export default function ProfileTicketsPreview({
  tickets,
  totalCount,
}: ProfileTicketsPreviewProps) {
  return (
    <ProfileTable
      title="Upcoming Tickets"
      count={totalCount}
      countLabel={totalCount === 1 ? "ticket" : "tickets"}
      viewAllHref="/profile/tickets"
      isEmpty={tickets.length === 0}
      emptyIcon={<TicketOutlineIcon className="w-6 h-6 text-neutral-500" />}
      emptyMessage="No upcoming tickets"
      emptyAction={{ label: "Browse events", href: "/events" }}
    >
      {tickets.map((ticket, index) => {
        const isUsable =
          ticket.status === "VALIDATED" || ticket.status === "PENDING";

        return (
          <ProfileTableRowDiv key={ticket.id} index={index}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-neutral-200 font-medium truncate">
                  {ticket.eventName} – {ticket.ticketHolderName}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[ticket.status] || "bg-gray-500/20 text-gray-400"}`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="text-xs text-neutral-500 font-mono">
                {ticket.shortId}
              </div>
            </div>
            {isUsable && (
              <Link
                href={`/profile/tickets/${ticket.shortId}`}
                className="ml-4 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex-shrink-0"
              >
                View
              </Link>
            )}
          </ProfileTableRowDiv>
        );
      })}
    </ProfileTable>
  );
}

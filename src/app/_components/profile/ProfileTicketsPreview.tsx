"use client";

import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import ProfileTable, { ProfileTableRow, ProfileTableRowDiv } from "./ProfileTable";

interface ProfileTicketsPreviewProps {
  tickets: SerializedTicket[];
  totalCount: number;
}

const statusColors: Record<string, string> = {
  VALIDATED: "bg-emerald-500/20 text-emerald-400",
  PENDING: "bg-emerald-500/20 text-emerald-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  VALIDATED: "Ready",
  PENDING: "Ready",
  SCANNED: "Used",
  CANCELLED: "Cancelled",
  BANNED: "Banned",
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
        const isClickable =
          ticket.status === "VALIDATED" ||
          ticket.status === "PENDING" ||
          ticket.status === "SCANNED";

        const rowContent = (
          <>
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
                    {statusLabels[ticket.status] || ticket.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  {ticket.shortId}
                </div>
              </div>
            </div>
          </>
        );

        if (isClickable) {
          return (
            <ProfileTableRow
              key={ticket.id}
              index={index}
              href={`/profile/tickets/${ticket.shortId}`}
            >
              {rowContent}
            </ProfileTableRow>
          );
        }

        return (
          <ProfileTableRowDiv key={ticket.id} index={index}>
            {rowContent}
          </ProfileTableRowDiv>
        );
      })}
    </ProfileTable>
  );
}

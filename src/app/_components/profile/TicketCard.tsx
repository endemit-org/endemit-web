"use client";

import Link from "next/link";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";

interface TicketCardProps {
  ticket: SerializedTicket;
}

const statusColors: Record<string, string> = {
  VALIDATED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
  REFUND_REQUESTED: "bg-orange-500/20 text-orange-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
};

export default function TicketCard({ ticket }: TicketCardProps) {
  const isUsable = ticket.status === "VALIDATED" || ticket.status === "PENDING";

  return (
    <div className="bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusColors[ticket.status] || "bg-gray-500/20 text-gray-400"}`}
            >
              {ticket.status}
            </span>
            {ticket.isGuestList && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Guest List
              </span>
            )}
          </div>

          <h3 className="font-medium text-neutral-200 mb-1 truncate">
            {ticket.eventName}
          </h3>

          <div className="text-sm text-neutral-400 space-y-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="truncate">{ticket.ticketHolderName}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              <span className="font-mono text-xs">{ticket.shortId}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {ticket.price > 0 && (
            <span className="text-sm text-neutral-400">
              €{ticket.price.toFixed(2)}
            </span>
          )}

          {isUsable && (
            <Link
              href={`/ticket/${ticket.shortId}`}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              View Ticket
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Column, Table } from "@/app/_components/table/Table";
import { SerializedTicket } from "@/domain/ticket/types/ticket";

export default function TicketsTable({
  tickets,
  onRowClick,
}: {
  tickets: SerializedTicket[];
  onRowClick?: (row: SerializedTicket) => void;
}) {
  const columns: Column<SerializedTicket>[] = [
    {
      key: "shortId",
      header: "Ticket ID",
      sortable: true,
      render: ticket => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{ticket.shortId}</span>
          {ticket.isGuestList && (
            <span className="rounded-full px-2 py-0.5 text-xs bg-purple-100 text-purple-800 font-medium">
              Guest
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ticketHolderName",
      header: "Customer",
      sortable: true,
    },
    {
      key: "ticketPayerEmail",
      header: "Email",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: ticket => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            ticket.status === "SCANNED"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {ticket.status}
        </span>
      ),
    },
  ];

  return <Table data={tickets} columns={columns} onRowClick={onRowClick} />;
}

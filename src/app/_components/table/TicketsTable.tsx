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
        <span className="font-mono text-xs">{ticket.shortId}</span>
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
      key: "scanCount",
      header: "Scans",
      sortable: true,
      render: ticket => (
        <span
          className={`font-medium ${
            ticket.scanCount > 0 ? "text-green-600" : "text-gray-500"
          }`}
        >
          {ticket.scanCount}
        </span>
      ),
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

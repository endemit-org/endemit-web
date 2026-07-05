"use client";

import { useTranslations } from "next-intl";
import { Column, Table } from "@/app/_components/table/Table";
import { SerializedTicket } from "@/domain/ticket/types/ticket";

export default function TicketsTable({
  tickets,
  onRowClick,
}: {
  tickets: SerializedTicket[];
  onRowClick?: (row: SerializedTicket) => void;
}) {
  const t = useTranslations("admin.tickets.table");
  const ts = useTranslations("admin.status.ticket");
  const columns: Column<SerializedTicket>[] = [
    {
      key: "shortId",
      header: t("ticketId"),
      sortable: true,
      render: ticket => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{ticket.shortId}</span>
          {ticket.isGuestList && (
            <span className="rounded-full px-2 py-0.5 text-xs bg-purple-100 text-purple-800 font-medium">
              {t("guest")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ticketHolderName",
      header: t("customer"),
      sortable: true,
    },
    {
      key: "ticketPayerEmail",
      header: t("email"),
      sortable: true,
    },
    {
      key: "status",
      header: t("status"),
      sortable: true,
      render: ticket => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            ticket.status === "SCANNED"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {ts(ticket.status)}
        </span>
      ),
    },
  ];

  return <Table data={tickets} columns={columns} onRowClick={onRowClick} />;
}

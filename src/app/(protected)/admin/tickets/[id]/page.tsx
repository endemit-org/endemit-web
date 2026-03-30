import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTicketById } from "@/domain/ticket/operations/getTicketById";
import { formatPrice, formatDateTime } from "@/lib/util/formatting";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import clsx from "clsx";
import TicketDownloadButton from "@/app/_components/admin/TicketDownloadButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketById(id);

  return {
    title: ticket
      ? `Ticket ${ticket.shortId}  •  Tickets  •  Admin`
      : "Ticket Not Found",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  // Permission check - must have TICKETS_READ_ALL to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.TICKETS_READ_ALL)) {
    redirect("/admin");
  }

  const { id } = await params;
  const ticket = await getTicketById(id);

  if (!ticket) {
    notFound();
  }

  const isInvalid =
    ticket.status === "CANCELLED" ||
    ticket.status === "REFUNDED" ||
    ticket.status === "BANNED";
  const isChecked =
    ticket.status === "SCANNED" || ticket.status === "VALIDATED";

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/events/${ticket.eventId}`}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
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
          Back to Event
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Ticket {ticket.shortId}
              </h1>
              {ticket.isGuestList && (
                <span className="rounded-full px-3 py-1 text-sm bg-purple-100 text-purple-800 font-medium">
                  Guest List
                </span>
              )}
            </div>
            <span
              className={clsx(
                "px-3 py-1 rounded-full text-sm font-medium self-start",
                isInvalid && "bg-red-100 text-red-800",
                isChecked && "bg-green-100 text-green-800",
                !isInvalid && !isChecked && "bg-blue-100 text-blue-800"
              )}
            >
              {ticket.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Ticket Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ticket ID</span>
                <span className="font-mono text-sm">{ticket.shortId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium">{ticket.ticketHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span>{ticket.ticketPayerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event</span>
                <span>{ticket.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-medium">{formatPrice(Number(ticket.price))}</span>
              </div>
              {ticket.scanCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Scan Count</span>
                  <span className="font-medium text-green-600">
                    {ticket.scanCount}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Order Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order ID</span>
                <Link
                  href={`/admin/orders/${ticket.orderId}`}
                  className="font-mono text-sm text-blue-600 hover:text-blue-800"
                >
                  {ticket.orderId.slice(0, 12)}...
                </Link>
              </div>
              {ticket.order && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer</span>
                    <span>{ticket.order.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span>{ticket.order.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Status</span>
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        ticket.order.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {ticket.order.status}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Actions
            </h2>
            <div className="flex gap-3">
              <TicketDownloadButton ticketId={ticket.id} shortId={ticket.shortId} holderName={ticket.ticketHolderName} />
              <Link
                href={`/admin/events/${ticket.eventId}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
              >
                View Event
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

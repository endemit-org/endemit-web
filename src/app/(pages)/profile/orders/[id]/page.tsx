import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { getOrderWithTickets } from "@/domain/order/operations/getOrderWithTickets";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import clsx from "clsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Order ${id.slice(0, 8)}...`,
    description: "View order details",
    robots: {
      index: false,
      follow: false,
    },
  };
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-500/20 text-green-400",
  CREATED: "bg-yellow-500/20 text-yellow-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
  EXPIRED: "bg-gray-500/20 text-gray-400",
  SHIPPED: "bg-blue-500/20 text-blue-400",
  DELIVERED: "bg-green-500/20 text-green-400",
};

const ticketStatusColors: Record<string, string> = {
  VALIDATED: "bg-emerald-500/20 text-emerald-400",
  PENDING: "bg-emerald-500/20 text-emerald-400",
  SCANNED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  BANNED: "bg-red-500/20 text-red-400",
  REFUND_REQUESTED: "bg-orange-500/20 text-orange-400",
  REFUNDED: "bg-gray-500/20 text-gray-400",
};

const ticketStatusLabels: Record<string, string> = {
  VALIDATED: "Ready to scan",
  PENDING: "Ready to scan",
  SCANNED: "Used",
  CANCELLED: "Cancelled",
  BANNED: "Banned",
  REFUND_REQUESTED: "Refund Requested",
  REFUNDED: "Refunded",
};

export default async function ProfileOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    // Fetch order to get email for signin prefill
    const order = await getOrderWithTickets(id);
    const params = new URLSearchParams();
    if (order?.email) {
      params.set("email", order.email);
    }
    params.set("callbackUrl", `/profile/orders/${id}`);
    redirect(`/signin?${params.toString()}`);
  }

  const order = await getOrderWithTickets(id);

  if (!order) {
    notFound();
  }

  // Verify the order belongs to this user (by email match)
  if (order.email !== user.email) {
    notFound();
  }

  return (
    <OuterPage>
      <PageHeadline
        title="Order Details"
        segments={[
          { label: "Endemit", path: "" },
          { label: "My Profile", path: "profile" },
          { label: "Orders", path: "orders" },
          { label: `#${id.slice(-8)}`, path: id },
        ]}
      />

      <InnerPage>
        <div className="mb-6">
          <Link
            href="/profile/orders"
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
            Back to Orders
          </Link>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-neutral-800 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-neutral-400 font-mono">{order.id}</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {formatDateTime(new Date(order.createdAt))}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-3 py-1 text-sm font-medium self-start",
                  statusColors[order.status] || "bg-gray-500/20 text-gray-400"
                )}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingRequired &&
            order.shippingAddress &&
            (() => {
              const addr = order.shippingAddress as {
                name?: string;
                address?: string;
                city?: string;
                postalCode?: string;
                country?: string;
                phone?: string;
              };
              return (
                <div className="rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-neutral-200 mb-4">
                    Shipping Address
                  </h2>
                  <div className="space-y-2 text-neutral-300">
                    {addr.name && <p>{addr.name}</p>}
                    {addr.address && <p>{addr.address}</p>}
                    {(addr.postalCode || addr.city) && (
                      <p>
                        {[addr.postalCode, addr.city].filter(Boolean).join(" ")}
                      </p>
                    )}
                    {addr.country && <p>{addr.country}</p>}
                    {addr.phone && (
                      <p className="text-neutral-400">{addr.phone}</p>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Items */}
          <div className="bg-neutral-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-200">
                Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-neutral-700">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-neutral-200 font-medium">{item.name}</p>
                    <p className="text-sm text-neutral-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-neutral-200 font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-neutral-950 rounded-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold text-neutral-200 mb-4">
              Summary
            </h2>
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount != null && order.discountAmount < 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingAmount != null && order.shippingAmount > 0 && (
              <div className="flex justify-between text-neutral-400">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-neutral-200 pt-3 border-t border-neutral-700">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Tickets */}
          {order.tickets.length > 0 && (
            <div className="bg-neutral-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-200">
                  Tickets ({order.tickets.length})
                </h2>
              </div>
              <div className="divide-y divide-neutral-700">
                {order.tickets.map(ticket => (
                  <Link
                    key={ticket.id}
                    href={`/profile/tickets/${ticket.shortId}`}
                    className="p-4 flex items-center justify-between hover:bg-neutral-700/50 transition-colors group"
                  >
                    <div>
                      <p className="text-neutral-200 font-medium">
                        {ticket.eventName} – {ticket.ticketHolderName}
                      </p>
                      <p className="text-xs text-neutral-500 font-mono mt-1">
                        {ticket.shortId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={clsx(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          ticketStatusColors[ticket.status] ||
                            "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {ticketStatusLabels[ticket.status] || ticket.status}
                      </span>
                      <svg
                        className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </InnerPage>
    </OuterPage>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOrderWithTickets } from "@/domain/order/operations/getOrderWithTickets";
import { formatPrice, formatDateTime } from "@/lib/util/formatting";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import OrderActionsWrapper from "@/app/_components/admin/OrderActionsWrapper";
import clsx from "clsx";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return {
    title: `Order ${id.slice(0, 8)}...  •  Orders  •  Admin`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  PREPARING: "bg-blue-100 text-blue-800",
  IN_DELIVERY: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  REFUND_REQUESTED: "bg-orange-100 text-orange-800",
  PARTIALLY_REFUNDED: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  // Permission check - must have ORDERS_READ_ALL to view this page
  if (!currentUser?.permissions.includes(PERMISSIONS.ORDERS_READ_ALL)) {
    redirect("/admin");
  }

  const { id } = await params;
  const order = await getOrderWithTickets(id);

  if (!order) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orders"
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
          Back to Orders
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Order Details
              </h1>
              <p className="text-sm text-gray-500 font-mono mt-1">{order.id}</p>
            </div>
            <span
              className={clsx(
                "rounded-full px-3 py-1 text-sm font-medium self-start",
                statusColors[order.status] || "bg-gray-100 text-gray-800"
              )}
            >
              {order.status}
            </span>
          </div>

          {/* Order Actions */}
          <div className="mt-4">
            <OrderActionsWrapper
              orderId={order.id}
              status={order.status}
              items={order.items}
              totalAmount={order.totalAmount}
              refundedAmount={order.refundedAmount}
              userPermissions={currentUser.permissions}
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Customer Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {order.name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{order.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <a
                  href={`mailto:${order.email}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {order.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {formatDateTime(new Date(order.createdAt))}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Order Summary
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount != null && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              {order.shippingAmount != null && order.shippingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span>{formatPrice(order.shippingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Items ({order.items.length})
            </h2>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.category} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {order.tickets.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Tickets ({order.tickets.length})
              </h2>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {order.tickets.map(ticket => (
                  <Link
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="block p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ticket.eventName}</p>
                          {ticket.isGuestList && (
                            <span className="rounded-full px-2 py-0.5 text-xs bg-purple-100 text-purple-800 font-medium">
                              Guest
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {ticket.ticketHolderName} • {ticket.ticketPayerEmail}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {ticket.shortId}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={clsx(
                            "inline-block rounded-full px-2 py-1 text-xs font-medium",
                            ticket.status === "SCANNED"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "PENDING"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {ticket.status}
                        </span>
                        <p className="text-sm font-medium mt-1">
                          {formatPrice(ticket.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {order.tickets.length > 0 && order.tickets[0]?.eventId && (
                <Link
                  href={`/admin/events/${order.tickets[0].eventId}`}
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
                >
                  View event tickets →
                </Link>
              )}
            </section>
          )}

          {order.shippingRequired && order.shippingAddress && (() => {
            const addr = order.shippingAddress as {
              name?: string;
              address?: string;
              city?: string;
              postalCode?: string;
              country?: string;
              phone?: string;
            };
            return (
            <section>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Shipping Address
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {addr.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{addr.name}</span>
                  </div>
                )}
                {addr.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{addr.address}</span>
                  </div>
                )}
                {(addr.postalCode || addr.city) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-medium">
                      {[addr.postalCode, addr.city].filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
                {addr.country && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{addr.country}</span>
                  </div>
                )}
                {addr.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <a
                      href={`tel:${addr.phone}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {addr.phone}
                    </a>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [addr.address, addr.postalCode, addr.city, addr.country]
                        .filter(Boolean)
                        .join(", ")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    View on Google Maps
                  </a>
                </div>
              </div>
            </section>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

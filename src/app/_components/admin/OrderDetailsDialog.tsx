"use client";

import { SerializedOrderWithTickets } from "@/domain/order/types/serialized";
import { formatPrice, formatDateTime } from "@/lib/util/formatting";
import clsx from "clsx";
import Link from "next/link";

interface OrderDetailsDialogProps {
  order: SerializedOrderWithTickets | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  REFUND_REQUESTED: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export default function OrderDetailsDialog({
  order,
  isOpen,
  isLoading,
  onClose,
}: OrderDetailsDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        ) : order ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details
                </h2>
                <span
                  className={clsx(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    statusColors[order.status] || "bg-gray-100 text-gray-800"
                  )}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-mono mt-1">{order.id}</p>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Customer Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {order.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{order.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{order.email}</span>
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
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Order Summary
                </h3>
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
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Items ({order.items.length})
                </h3>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <div key={index} className="p-4 flex justify-between items-center">
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
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Tickets ({order.tickets.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    {order.tickets.map(ticket => (
                      <div key={ticket.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{ticket.eventName}</p>
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
                      </div>
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

              {order.shippingRequired && order.shippingAddress && (
                <section>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(order.shippingAddress, null, 2)}
                    </pre>
                  </div>
                </section>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-600">
            Order not found
          </div>
        )}
      </div>
    </div>
  );
}

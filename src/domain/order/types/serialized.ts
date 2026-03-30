import type { Order, Ticket, OrderStatus } from "@prisma/client";
import type { ProductInOrder } from "./order";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";
import { serializeTicket } from "@/domain/ticket/util";

export interface SerializedOrder {
  id: string;
  stripeSession: string;
  name: string | null;
  email: string;
  subtotal: number;
  totalAmount: number;
  shippingAmount: number | null;
  discountAmount: number | null;
  shippingRequired: boolean;
  shippingAddress: Record<string, unknown> | null;
  items: ProductInOrder[];
  metadata: Record<string, unknown> | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  ticketCount: number;
}

export interface SerializedOrderWithTickets extends Omit<SerializedOrder, "ticketCount"> {
  tickets: SerializedTicket[];
}

export function serializeOrder(
  order: Order & { _count?: { tickets: number } }
): SerializedOrder {
  return {
    id: order.id,
    stripeSession: order.stripeSession,
    name: order.name,
    email: order.email,
    subtotal: Number(order.subtotal),
    totalAmount: Number(order.totalAmount),
    shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : null,
    discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
    shippingRequired: order.shippingRequired,
    shippingAddress: order.shippingAddress as Record<string, unknown> | null,
    items: order.items as unknown as ProductInOrder[],
    metadata: order.metadata as Record<string, unknown> | null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    ticketCount: order._count?.tickets ?? 0,
  };
}

export function serializeOrderWithTickets(
  order: Order & { tickets: Ticket[] }
): SerializedOrderWithTickets {
  return {
    id: order.id,
    stripeSession: order.stripeSession,
    name: order.name,
    email: order.email,
    subtotal: Number(order.subtotal),
    totalAmount: Number(order.totalAmount),
    shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : null,
    discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
    shippingRequired: order.shippingRequired,
    shippingAddress: order.shippingAddress as Record<string, unknown> | null,
    items: order.items as unknown as ProductInOrder[],
    metadata: order.metadata as Record<string, unknown> | null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    tickets: order.tickets.map(ticket => serializeTicket(ticket)),
  };
}

export interface PaginatedOrders {
  orders: SerializedOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalRevenue: number;
}

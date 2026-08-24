"use server";

import assert from "node:assert";
import { OrderStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import { getOrderWithTickets } from "@/domain/order/operations/getOrderWithTickets";
import type { PaginatedOrders, SerializedOrderWithTickets } from "@/domain/order/types/serialized";

export interface OrderListFilters {
  search?: string;
  status?: string;
}

export async function fetchOrders(
  page?: number,
  filters?: OrderListFilters
): Promise<PaginatedOrders> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  const search = filters?.search?.trim() || undefined;
  // Client-supplied — only pass through known enum values.
  const status =
    filters?.status &&
    Object.values(OrderStatus).includes(filters.status as OrderStatus)
      ? (filters.status as OrderStatus)
      : undefined;

  return await getAllOrders({ page, search, status });
}

export async function fetchOrderById(orderId: string): Promise<SerializedOrderWithTickets | null> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  return await getOrderWithTickets(orderId);
}

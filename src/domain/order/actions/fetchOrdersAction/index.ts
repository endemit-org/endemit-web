"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllOrders } from "@/domain/order/operations/getAllOrders";
import { getOrderWithTickets } from "@/domain/order/operations/getOrderWithTickets";
import type { PaginatedOrders, SerializedOrderWithTickets } from "@/domain/order/types/serialized";

export async function fetchOrders(page?: number): Promise<PaginatedOrders> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  return await getAllOrders({ page });
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

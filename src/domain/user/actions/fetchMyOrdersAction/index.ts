"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { getOrdersByUserId } from "@/domain/order/operations/getOrdersByUserId";
import type { SerializedOrder } from "@/domain/order/types/serialized";

export async function fetchMyOrdersAction(): Promise<SerializedOrder[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  return await getOrdersByUserId(currentUser.id);
}

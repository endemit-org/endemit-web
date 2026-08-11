"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { deletePosOrder } from "@/domain/pos/operations/deletePosOrder";

export async function deletePosOrderAction(input: {
  orderId: string;
}): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "User not authenticated" };
  }
  if (!user.permissions.includes(PERMISSIONS.POS_ORDERS_REFUND)) {
    return {
      success: false,
      message: "User not authorized to delete POS orders",
    };
  }

  try {
    await deletePosOrder(input.orderId);
    return { success: true, message: "Order deleted" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete order",
    };
  }
}

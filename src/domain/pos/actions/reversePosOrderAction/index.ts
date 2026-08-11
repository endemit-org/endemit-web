"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { reversePosOrder } from "@/domain/pos/operations/reversePosOrder";

export async function reversePosOrderAction(input: {
  orderId: string;
}): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "User not authenticated" };
  }
  if (!user.permissions.includes(PERMISSIONS.POS_ORDERS_REFUND)) {
    return {
      success: false,
      message: "User not authorized to reverse POS orders",
    };
  }

  try {
    await reversePosOrder(input.orderId, user.id);
    return { success: true, message: "Order reversed" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reverse order",
    };
  }
}

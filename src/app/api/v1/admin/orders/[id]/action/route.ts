import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateOrderStatusValidated } from "@/domain/order/operations/updateOrderStatus";
import { requestRefund, cancelRefundRequest } from "@/domain/order/operations/processRefund";
import { prisma } from "@/lib/services/prisma";
import { OrderAction } from "@/domain/order/operations/getOrderActions";

// Map actions to target statuses
const ACTION_STATUS_MAP: Partial<Record<OrderAction, OrderStatus>> = {
  mark_preparing: "PREPARING",
  mark_in_delivery: "IN_DELIVERY",
  mark_completed: "COMPLETED",
  cancel_order: "CANCELLED",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for ORDERS_UPDATE permission
    if (!user.permissions.includes(PERMISSIONS.ORDERS_UPDATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const action = body.action as OrderAction;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Handle special actions
    if (action === "request_refund") {
      // Need ORDERS_REFUND permission for refund actions
      if (!user.permissions.includes(PERMISSIONS.ORDERS_REFUND)) {
        return NextResponse.json(
          { error: "Refund permission required" },
          { status: 403 }
        );
      }
      await requestRefund(orderId, user.id);
      return NextResponse.json({ success: true, action });
    }

    if (action === "cancel_refund_request") {
      // Get the order to determine what status to restore to
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { metadata: true, shippingRequired: true },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Restore to PAID or COMPLETED based on shipping requirement
      const restoreStatus: OrderStatus = order.shippingRequired
        ? "PAID"
        : "COMPLETED";

      await cancelRefundRequest(orderId, restoreStatus);
      return NextResponse.json({ success: true, action });
    }

    // Handle standard status transitions
    const targetStatus = ACTION_STATUS_MAP[action];
    if (!targetStatus) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await updateOrderStatusValidated(orderId, targetStatus);

    return NextResponse.json({ success: true, action, newStatus: targetStatus });
  } catch (error) {
    console.error("Order action error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to execute action";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import {
  calculateRefundLimit,
  RefundItemSelection,
} from "@/domain/order/operations/calculateRefundLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for ORDERS_REFUND permission
    if (!user.permissions.includes(PERMISSIONS.ORDERS_REFUND)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const items = body.items as RefundItemSelection[];
    const includeShipping = body.includeShipping as boolean | undefined;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing or invalid items array" },
        { status: 400 }
      );
    }

    // Fetch order with refunds
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { refunds: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch wallet if user exists
    const wallet = order.userId
      ? await prisma.wallet.findUnique({ where: { userId: order.userId } })
      : null;

    // Calculate refund limit
    const result = calculateRefundLimit({
      order,
      wallet,
      selectedItems: items,
      includeShipping,
    });

    // Include shipping info for the UI
    const shippingAmountCents = order.shippingAmount
      ? Math.round(Number(order.shippingAmount) * 100)
      : 0;

    return NextResponse.json({
      ...result,
      orderHasShipping: shippingAmountCents > 0,
      shippingAmountCents,
    });
  } catch (error) {
    console.error("Refund limit calculation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to calculate refund limit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

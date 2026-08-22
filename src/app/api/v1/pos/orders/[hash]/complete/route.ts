import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { completePosOrderFulfillment } from "@/domain/pos/operations/completePosOrderFulfillment";

// Seller marks a to-serve order as served (fulfillment complete).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { hash } = await params;
    const order = await prisma.posOrder.findUnique({
      where: { orderHash: hash },
      select: { sellerId: true, registerId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.sellerId !== user.id) {
      const assignment = await prisma.posRegisterSeller.findFirst({
        where: { registerId: order.registerId, userId: user.id },
        select: { id: true },
      });
      if (!assignment) {
        return NextResponse.json(
          { error: "Not authorized to complete this order" },
          { status: 403 }
        );
      }
    }

    const updated = await completePosOrderFulfillment(hash);
    return NextResponse.json({ success: true, orderId: updated.id });
  } catch (error) {
    console.error("Complete POS order error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to complete order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

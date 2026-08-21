import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { markPosOrderPaid } from "@/domain/pos/operations/markPosOrderPaid";
import { PosError } from "@/domain/pos/types/posError";

// Seller marks an order paid with physical tender (cash / external card
// terminal). Unlike /pay, this is a seller-identity action.
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
    const body = await request.json();
    const method = body?.method;
    const tipAmount = Number(body?.tipAmount ?? 0);

    if (method !== "CASH" && method !== "CARD") {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Only the order's seller or another seller assigned to its register
    const order = await prisma.posOrder.findUnique({
      where: { orderHash: hash },
      select: { id: true, sellerId: true, registerId: true },
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
          { error: "Not authorized to mark this order paid" },
          { status: 403 }
        );
      }
    }

    const result = await markPosOrderPaid({
      orderHash: hash,
      method,
      tipAmount,
      sellerUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        shortCode: result.order.shortCode,
        orderHash: result.order.orderHash,
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        total: result.order.total,
        tipAmount: result.order.tipAmount,
        paidAt: result.order.paidAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Mark POS order paid error:", error);
    if (error instanceof PosError) {
      return NextResponse.json(
        { error: error.message, errorCode: error.code },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to mark order paid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

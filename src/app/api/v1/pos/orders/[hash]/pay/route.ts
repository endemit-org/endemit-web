import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { payPosOrder } from "@/domain/pos/operations/payPosOrder";
import { prisma } from "@/lib/services/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hash } = await params;
    const body = await request.json();
    const { tipAmount = 0 } = body;

    if (typeof tipAmount !== "number" || tipAmount < 0) {
      return NextResponse.json({ error: "Invalid tip amount" }, { status: 400 });
    }

    // When the seller triggers /pay (sticker-fallback flow), the order already
    // has a customerId set by scanPosOrder. Use that as the customer for the
    // payment rather than the seller's own id.
    const existingOrder = await prisma.posOrder.findUnique({
      where: { orderHash: hash },
      select: { sellerId: true, customerId: true },
    });

    let customerId = user.id;
    if (existingOrder && existingOrder.sellerId === user.id) {
      if (!existingOrder.customerId) {
        return NextResponse.json(
          { error: "Order has not been scanned yet" },
          { status: 400 }
        );
      }
      customerId = existingOrder.customerId;
    }

    const result = await payPosOrder({
      orderHash: hash,
      customerId,
      tipAmount,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        shortCode: result.order.shortCode,
        total: result.order.total,
        tipAmount: result.order.tipAmount,
        status: result.order.status,
        paidAt: result.order.paidAt,
      },
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Pay POS order error:", error);
    const message = error instanceof Error ? error.message : "Failed to process payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

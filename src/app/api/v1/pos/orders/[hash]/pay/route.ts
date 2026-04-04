import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { payPosOrder } from "@/domain/pos/operations/payPosOrder";

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

    const result = await payPosOrder({
      orderHash: hash,
      customerId: user.id,
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

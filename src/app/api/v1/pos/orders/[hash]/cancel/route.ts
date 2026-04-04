import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { cancelPosOrder } from "@/domain/pos/operations/cancelPosOrder";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes(PERMISSIONS.POS_SELL)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { hash } = await params;

    const order = await cancelPosOrder(hash, user.id, "seller");

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        shortCode: order.shortCode,
        status: order.status,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
      },
    });
  } catch (error) {
    console.error("Cancel POS order error:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

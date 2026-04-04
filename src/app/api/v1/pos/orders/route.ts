import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { createPosOrder } from "@/domain/pos/operations/createPosOrder";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes(PERMISSIONS.POS_SELL)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { registerId, items } = body;

    if (!registerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await createPosOrder({
      registerId,
      sellerId: user.id,
      items,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        shortCode: order.shortCode,
        orderHash: order.orderHash,
        subtotal: order.subtotal,
        total: order.total,
        status: order.status,
        expiresAt: order.expiresAt,
        items: order.items,
        register: order.register,
      },
    });
  } catch (error) {
    console.error("Create POS order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

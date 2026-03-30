import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { copyPosOrder } from "@/domain/pos/operations/copyPosOrder";
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

    const newOrder = await copyPosOrder(hash, user.id);

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        shortCode: newOrder.shortCode,
        orderHash: newOrder.orderHash,
        subtotal: newOrder.subtotal,
        total: newOrder.total,
        status: newOrder.status,
        expiresAt: newOrder.expiresAt,
        items: newOrder.items,
        register: newOrder.register,
      },
    });
  } catch (error) {
    console.error("Copy POS order error:", error);
    const message = error instanceof Error ? error.message : "Failed to copy order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { scanPosOrder } from "@/domain/pos/operations/scanPosOrder";

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

    const result = await scanPosOrder(hash, user.id);

    return NextResponse.json({
      success: true,
      order: {
        id: result.order.id,
        shortCode: result.order.shortCode,
        orderHash: result.order.orderHash,
        subtotal: result.order.subtotal,
        total: result.order.total,
        status: result.order.status,
        items: result.order.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
          direction: item.item.direction,
        })),
        register: {
          id: result.order.register.id,
          name: result.order.register.name,
        },
      },
      customer: result.customer,
      hasEnoughBalance: result.hasEnoughBalance,
    });
  } catch (error) {
    console.error("Scan POS order error:", error);
    const message = error instanceof Error ? error.message : "Failed to scan order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

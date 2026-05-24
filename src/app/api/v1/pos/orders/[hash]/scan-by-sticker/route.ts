import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { scanPosOrder } from "@/domain/pos/operations/scanPosOrder";
import { resolveSticker } from "@/domain/sticker/operations/resolveSticker";

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
    const stickerCode =
      typeof body?.stickerCode === "string" ? body.stickerCode : "";

    // Only the seller for this order (on the register's seller list) may
    // trigger a sticker fallback scan.
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
          { error: "Not authorized to scan backup stickers on this order" },
          { status: 403 }
        );
      }
    }

    const { userId: customerId } = await resolveSticker(stickerCode);

    const result = await scanPosOrder(hash, customerId);

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
    console.error("Scan POS order by sticker error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to resolve sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

// Paid orders awaiting fulfillment at this register (register-wide, oldest
// first) — feeds the seller sidebar and the kitchen display. Always live.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const assignment = await prisma.posRegisterSeller.findUnique({
      where: { registerId_userId: { registerId: id, userId: user.id } },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Not assigned to this register" },
        { status: 403 }
      );
    }

    const orders = await prisma.posOrder.findMany({
      where: { registerId: id, status: "PAID", fulfillmentStatus: "OPEN" },
      orderBy: { paidAt: "asc" },
      include: {
        items: { select: { name: true, quantity: true } },
      },
    });

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderHash: order.orderHash,
        shortCode: order.shortCode,
        queueNumber: order.queueNumber,
        note: order.note,
        paidAt: order.paidAt?.toISOString() ?? order.createdAt.toISOString(),
        items: order.items,
      })),
    });
  } catch (error) {
    console.error("POS to-serve error:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}

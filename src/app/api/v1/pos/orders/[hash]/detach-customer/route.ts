import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

// Detach a pre-attached wallet customer from a PENDING order so it can be
// paid another way ("pay differently" on the wallet confirm screen).
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
      select: { id: true, status: true, sellerId: true, registerId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order is no longer pending" },
        { status: 400 }
      );
    }
    if (order.sellerId !== user.id) {
      const assignment = await prisma.posRegisterSeller.findFirst({
        where: { registerId: order.registerId, userId: user.id },
        select: { id: true },
      });
      if (!assignment) {
        return NextResponse.json(
          { error: "Not authorized for this order" },
          { status: 403 }
        );
      }
    }

    await prisma.posOrder.update({
      where: { id: order.id },
      data: { customerId: null, walletId: null, scannedAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Detach POS order customer error:", error);
    return NextResponse.json(
      { error: "Failed to detach customer" },
      { status: 400 }
    );
  }
}

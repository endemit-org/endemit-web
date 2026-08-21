import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

const TRANSACTIONS_SHOWN = 10;

// Live verification view for sellers — always reads straight from the DB,
// deliberately no unstable_cache.
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
      where: {
        registerId_userId: {
          registerId: id,
          userId: user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Not assigned to this register" },
        { status: 403 }
      );
    }

    const orders = await prisma.posOrder.findMany({
      where: { registerId: id },
      orderBy: { createdAt: "desc" },
      take: TRANSACTIONS_SHOWN,
      include: {
        items: {
          select: { name: true, quantity: true, total: true },
        },
        seller: {
          select: { name: true },
        },
        customer: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      transactions: orders.map(order => ({
        id: order.id,
        orderHash: order.orderHash,
        shortCode: order.shortCode,
        status: order.status,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        tipAmount: order.tipAmount,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        cancelledAt: order.cancelledAt?.toISOString() ?? null,
        sellerName: order.seller.name,
        customerName: order.customer?.name ?? null,
        items: order.items,
      })),
    });
  } catch (error) {
    console.error("POS register transactions error:", error);
    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}

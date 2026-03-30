import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

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

    // Check if user is assigned to this register
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

    const register = await prisma.posRegister.findUnique({
      where: { id },
      include: {
        items: {
          include: { item: true },
          where: {
            item: { status: "ACTIVE" },
          },
        },
        orders: {
          where: {
            status: "PENDING",
            sellerId: user.id,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            items: true,
          },
        },
      },
    });

    if (!register || register.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Register not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      register: {
        id: register.id,
        name: register.name,
        description: register.description,
        canTopUp: register.canTopUp,
        items: register.items.map(ri => ({
          id: ri.item.id,
          name: ri.item.name,
          description: ri.item.description,
          cost: ri.item.cost,
          direction: ri.item.direction,
        })),
        pendingOrders: register.orders.map(o => ({
          id: o.id,
          shortCode: o.shortCode,
          orderHash: o.orderHash,
          subtotal: o.subtotal,
          total: o.total,
          status: o.status,
          scannedAt: o.scannedAt,
          expiresAt: o.expiresAt,
          createdAt: o.createdAt,
          items: o.items,
        })),
      },
    });
  } catch (error) {
    console.error("Get register error:", error);
    return NextResponse.json(
      { error: "Failed to fetch register" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get registers assigned to this user
    const assignments = await prisma.posRegisterSeller.findMany({
      where: { userId: user.id },
      include: {
        register: {
          include: {
            items: {
              include: { item: true },
              where: {
                item: { status: "ACTIVE" },
              },
            },
            _count: {
              select: { orders: { where: { status: "PENDING" } } },
            },
          },
        },
      },
    });

    const registers = assignments
      .map(a => a.register)
      .filter(r => r.status === "ACTIVE")
      .map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        canTopUp: r.canTopUp,
        itemCount: r.items.length,
        pendingOrders: r._count.orders,
      }));

    return NextResponse.json({ registers });
  } catch (error) {
    console.error("Get registers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch registers" },
      { status: 500 }
    );
  }
}

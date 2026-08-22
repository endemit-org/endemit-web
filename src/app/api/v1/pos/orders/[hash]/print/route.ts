import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

// Queue a paid order for the Server Direct Print receipt printer.
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
    if (order.status !== "PAID") {
      return NextResponse.json({ error: "Order not paid" }, { status: 400 });
    }
    if (order.sellerId !== user.id) {
      const assignment = await prisma.posRegisterSeller.findFirst({
        where: { registerId: order.registerId, userId: user.id },
        select: { id: true },
      });
      if (!assignment) {
        return NextResponse.json(
          { error: "Not authorized to print this order" },
          { status: 403 }
        );
      }
    }

    const job = await prisma.posPrintJob.create({
      data: { posOrderId: order.id },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Queue POS print job error:", error);
    return NextResponse.json(
      { error: "Failed to queue print job" },
      { status: 400 }
    );
  }
}

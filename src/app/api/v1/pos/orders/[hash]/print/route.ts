import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { renderPosReceiptEpos } from "@/domain/pos/operations/renderPosReceiptEpos";

// Render a paid order's receipt as ePOS-Print XML for the seller's browser
// to push to the register's LAN printer (TM-P80II has no Server Direct
// Print). A PosPrintJob row tracks the outcome, reported back via
// /api/v1/pos/print/jobs/[jobId]/result.
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

    const xml = await renderPosReceiptEpos(order.id);

    const job = await prisma.posPrintJob.create({
      data: { posOrderId: order.id, attempts: 1 },
    });

    return NextResponse.json({ success: true, jobId: job.id, xml });
  } catch (error) {
    console.error("Queue POS print job error:", error);
    return NextResponse.json(
      { error: "Failed to queue print job" },
      { status: 400 }
    );
  }
}

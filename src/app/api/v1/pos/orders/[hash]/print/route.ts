import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { renderPosReceiptEpos } from "@/domain/pos/operations/renderPosReceiptEpos";

// The ticket-issuance wait below can hold the request up to ~8s.
export const maxDuration = 30;

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
      select: {
        id: true,
        status: true,
        sellerId: true,
        registerId: true,
        customerId: true,
        items: {
          select: {
            quantity: true,
            item: { select: { ticketEventId: true } },
          },
        },
      },
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

    // Sellers can reprint pieces when a print partially failed: "receipt"
    // (no slips), "tickets" (slips only, even for wallet buyers who by
    // default carry tickets in their profile), or "full" (default —
    // receipt + slips for anonymous sales).
    const body = (await request.json().catch(() => null)) as {
      parts?: "full" | "receipt" | "tickets";
    } | null;
    const parts = body?.parts ?? "full";
    const includeReceipt = parts !== "tickets";
    const ticketMode =
      parts === "tickets" ? "always" : parts === "receipt" ? "never" : "auto";

    // Tickets are issued async by Inngest after payment — auto-print races
    // them. Wait briefly for the expected count before rendering.
    const ticketableCount = order.items.reduce(
      (sum, i) => (i.item.ticketEventId ? sum + i.quantity : sum),
      0
    );
    const expectedTickets =
      ticketMode === "always" ||
      (ticketMode === "auto" && order.customerId === null)
        ? ticketableCount
        : 0;
    if (expectedTickets > 0) {
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const issued = await prisma.ticket.count({
          where: {
            posOrderId: order.id,
            status: { notIn: ["CANCELLED", "REFUNDED"] },
          },
        });
        if (issued >= expectedTickets) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (parts === "tickets") {
      const issued = await prisma.ticket.count({
        where: {
          posOrderId: order.id,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      });
      if (issued === 0) {
        return NextResponse.json(
          { error: "Order has no tickets" },
          { status: 400 }
        );
      }
    }

    const xml = await renderPosReceiptEpos(order.id, {
      includeReceipt,
      ticketMode,
    });

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

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { renderPosReceiptEpos } from "@/domain/pos/operations/renderPosReceiptEpos";

// The ticket safety wait below can hold the request a few seconds.
export const maxDuration = 30;

// Tickets are issued in the payment request, so they normally exist by the
// time the receipt auto-prints; this only covers the fallback path (inline
// issuance failed, Inngest is redoing it).
const TICKET_WAIT_MS = 3000;

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

    // "full" (default): receipt + a slip per ticket. "receipt"/"tickets":
    // partial reprints when a print half-failed.
    const body = (await request.json().catch(() => null)) as {
      parts?: "full" | "receipt" | "tickets";
    } | null;
    const parts = body?.parts ?? "full";
    const includeReceipt = parts !== "tickets";
    const ticketMode = parts === "receipt" ? "never" : "always";

    const countTickets = () =>
      prisma.ticket.count({
        where: {
          posOrderId: order.id,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      });
    const expectedTickets =
      ticketMode === "always"
        ? order.items.reduce(
            (sum, i) => (i.item.ticketEventId ? sum + i.quantity : sum),
            0
          )
        : 0;
    let issued = expectedTickets > 0 ? await countTickets() : 0;
    if (expectedTickets > 0 && issued < expectedTickets) {
      const deadline = Date.now() + TICKET_WAIT_MS;
      while (issued < expectedTickets && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 500));
        issued = await countTickets();
      }
    }
    const ticketsMissing = issued < expectedTickets;

    if (parts === "tickets" && issued === 0) {
      // A sale with ticket items whose tickets haven't landed yet is
      // "pending", not "none"
      return NextResponse.json(
        {
          error:
            expectedTickets > 0 ? "TICKETS_PENDING" : "Order has no tickets",
        },
        { status: expectedTickets > 0 ? 409 : 400 }
      );
    }

    const xml = await renderPosReceiptEpos(order.id, {
      includeReceipt,
      ticketMode,
    });

    const job = await prisma.posPrintJob.create({
      data: { posOrderId: order.id, attempts: 1 },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      xml,
      // Receipt still prints; the client flags the slips for a reprint
      ticketsMissing,
    });
  } catch (error) {
    console.error("Queue POS print job error:", error);
    return NextResponse.json(
      { error: "Failed to queue print job" },
      { status: 400 }
    );
  }
}

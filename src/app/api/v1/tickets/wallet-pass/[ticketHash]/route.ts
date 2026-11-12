import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { buildTicketApplePass } from "@/domain/wallet-pass/operations/buildTicketApplePass";
import { sanitizeForFilename } from "@/lib/util/formatting";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketHash: string }> }
) {
  try {
    const { ticketHash } = await params;

    if (!ticketHash) {
      return NextResponse.json(
        { error: "Ticket hash is required" },
        { status: 400 }
      );
    }

    // Find the ticket by hash
    const ticket = await prisma.ticket.findUnique({
      where: { ticketHash },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Only allow pass generation for valid/usable tickets
    const invalidStatuses = ["CANCELLED", "BANNED", "REFUNDED"];
    if (invalidStatuses.includes(ticket.status)) {
      return NextResponse.json(
        { error: "This ticket is no longer valid" },
        { status: 403 }
      );
    }

    // Generate the Apple Wallet pass (with expiry + PassKit update service)
    const passBuffer = await buildTicketApplePass(ticket);

    // Create a safe filename
    const eventSlug = sanitizeForFilename(ticket.eventName);
    const filename = `ticket-${eventSlug}-${ticket.shortId}.pkpass`;

    // Return the .pkpass file
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(passBuffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating Apple Wallet pass:", error);

    // Check for specific certificate errors
    if (error instanceof Error) {
      if (
        error.message.includes("certificate") ||
        error.message.includes("APPLE_")
      ) {
        return NextResponse.json(
          { error: "Apple Wallet pass configuration error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass" },
      { status: 500 }
    );
  }
}

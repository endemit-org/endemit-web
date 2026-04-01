import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { generateApplePass } from "@/domain/wallet-pass/operations/generateApplePass";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
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

    // Fetch event details from CMS to get venue info
    const event = await fetchEventFromCmsById(ticket.eventId);

    // Generate the Apple Wallet pass
    const passBuffer = await generateApplePass({
      ticketId: ticket.id,
      shortId: ticket.shortId,
      ticketHash: ticket.ticketHash,
      eventName: ticket.eventName,
      eventDate: event?.date_start ?? null,
      venueName: event?.venue?.name ?? null,
      venueAddress: event?.venue?.address ?? null,
      ticketHolderName: ticket.ticketHolderName,
      ticketPayerEmail: ticket.ticketPayerEmail,
      orderId: ticket.orderId,
      price: Number(ticket.price),
      qrContent: JSON.stringify(ticket.qrContent),
    });

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

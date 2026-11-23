import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import {
  TICKET_ALREADY_SCANNED_MESSAGE,
  TICKET_INVALID_HASH_MESSAGE,
  scanTicketByCode,
  scanTicketByHash,
} from "@/domain/ticket/operations/scanTicketByHash";

export async function POST(request: Request) {
  try {
    // Marking a ticket as scanned is a door-staff action. Without this check
    // anyone holding a leaked code or hash could burn someone else's ticket.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!user.permissions.includes("tickets:scan")) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    try {
      let result;

      if (typeof body.code === "string") {
        // Compact QR code as printed on the ticket (E2.<shortId>.<mac>)
        result = await scanTicketByCode(body.code);
      } else if (body.ticketHash) {
        // Legacy format - hash must match stored hash exactly
        result = await scanTicketByHash(body.ticketHash);
      } else {
        return NextResponse.json(
          { success: false, error: "Ticket code or hash is required" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        attended: result.attended,
        scanCount: result.scanCount,
        shortId: result.shortId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ticket could not be scanned";

      if (message === TICKET_ALREADY_SCANNED_MESSAGE) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 200 }
        );
      }

      if (message === TICKET_INVALID_HASH_MESSAGE) {
        return NextResponse.json(
          { success: false, error: message },
          { status: 200 }
        );
      }

      console.error(error);
      return NextResponse.json(
        { success: false, error: "Ticket not found or could not be scanned" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

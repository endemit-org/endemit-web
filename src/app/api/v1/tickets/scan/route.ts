import { NextResponse } from "next/server";
import {
  TICKET_ALREADY_SCANNED_MESSAGE,
  TICKET_INVALID_HASH_MESSAGE,
  scanTicketByHash,
  scanTicketByPayload,
} from "@/domain/ticket/operations/scanTicketByHash";
import type { QrTicketPayload } from "@/domain/ticket/types/ticket";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support both legacy (ticketHash only) and new (full payload) formats
    const hasFullPayload = body.shortId && body.hash;

    try {
      let result;

      if (hasFullPayload) {
        // New format with full QR payload - supports rotating hashes
        result = await scanTicketByPayload(body as QrTicketPayload);
      } else if (body.ticketHash) {
        // Legacy format - hash must match stored hash exactly
        result = await scanTicketByHash(body.ticketHash);
      } else {
        return NextResponse.json(
          { success: false, error: "Ticket hash or payload is required" },
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

import { NextResponse } from "next/server";
import assert from "node:assert";
import { scanTicketById } from "@/domain/ticket/actions";

export async function POST(request: Request) {
  try {
    const { ticketHash } = await request.json();

    assert(ticketHash, "Ticket hash is required");
    try {
      const { attended, scanCount, shortId } = await scanTicketById(ticketHash);

      return NextResponse.json({
        success: true,
        attended,
        scanCount,
        shortId,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found or could not be scanned",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateTicketImage } from "@/domain/ticket/operations/generateTicketImage";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticketData = searchParams.get("ticketData");

  if (!ticketData) {
    return NextResponse.json(
      { error: "ticketData parameter is required" },
      { status: 400 }
    );
  }

  try {
    const ticketImage = await generateTicketImage({
      shortId: "XH2F",
      hashId:
        "98456790388bf45e16daf38c739ef5ddb06e64a47d01d2d2dfb1a2d9242c3170953d3005781df31c06a9ae7df0f842f7b5908e39da87c87dcb4ede436ba0f567",
      qrData: JSON.stringify({
        hash: "98456790388bf45e16daf38c739ef5ddb06e64a47d01d2d2dfb1a2d9242c3170953d3005781df31c06a9ae7df0f842f7b5908e39da87c87dcb4ede436ba0f567",
        price: 20,
        eventId: "aOksGREAACQAq06C",
        orderId: "cmguzbejy0004dvro81banp3c",
        shortId: "6YHG",
        eventName: "Test event 2025",
        ticketHolderName: "Nejc Palir",
        ticketPayerEmail: "nejc.palir@gmail.com",
      }),
      eventName: "Po prešernovo v Majki",
      eventDetails: "KUD Kodeljevo Ljubljana",
      eventDate: "25. 11. 2025 @ 22:00",
      attendeeName: "Nejc Palir",
      attendeeEmail: "nejc.palir@gmail.com",
      artists: ["MOKILOK • UNKNOWN TEXTURE", "RHAEGAL • MMALI"],
      price: "90 €",
      coverImageUrl:
        "https://endemit.org/images/issun-boshi-vinyl-release/cover-without-border.jpg",
    });

    // const base64Data = ticketImage.replace(/^data:image\/png;base64,/, "");
    const imageBuffer = Buffer.from(ticketImage, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}

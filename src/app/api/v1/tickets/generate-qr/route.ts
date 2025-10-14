import { NextRequest, NextResponse } from "next/server";

import { generateTicketImage } from "@/domain/ticket/actions";

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
        "5e7f24ff8cd3eb1b68bd23351c98e30abba5560a3a42a86794800f82262b1462",
      qrData:
        "5e7f24ff8cd3eb1b68bd23351c98e30abba5560a3a42a86794800f82262b14625e7f24ff8cd3eb1b68bd23351c98e30abba5560a3a42a86794800f82262b14625e7f24ff8cd3eb1b68bd23351c98e30abba5560a3a42a86794800f82262b14625e7f24ff8cd3eb1b68bd23351c98e30abba5560a3a42a86794800f82262b1462",
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

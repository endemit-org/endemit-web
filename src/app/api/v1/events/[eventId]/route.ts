import { NextResponse } from "next/server";
import { fetchEventFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const product = await fetchEventFromCms(eventId);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching event from Prismic:", error);
    return NextResponse.json(
      { error: "Event not found" + (await params).eventId },
      { status: 404 }
    );
  }
}

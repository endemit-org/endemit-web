import { NextResponse } from "next/server";
import { fetchVenueFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;

    const venue = await fetchVenueFromCms(venueId);

    return NextResponse.json(venue, { status: 200 });
  } catch (error) {
    console.error("Error fetching venue from Prismic:", error);
    return NextResponse.json(
      { error: "Venue not found" + (await params).venueId },
      { status: 404 }
    );
  }
}

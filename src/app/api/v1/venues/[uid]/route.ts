import { NextResponse } from "next/server";
import { fetchVenueFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const venue = await fetchVenueFromCms(uid);

    return NextResponse.json(venue, { status: 200 });
  } catch (error) {
    console.error("Error fetching venue from Prismic:", error);
    return NextResponse.json(
      { error: "Venue not found" + (await params).uid },
      { status: 404 }
    );
  }
}

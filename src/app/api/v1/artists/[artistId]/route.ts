import { NextResponse } from "next/server";
import { fetchArtistFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { artistId } = await params;

    const venue = await fetchArtistFromCms(artistId);

    return NextResponse.json(venue, { status: 200 });
  } catch (error) {
    console.error("Error fetching artist from Prismic:", error);
    return NextResponse.json(
      { error: "Artist not found" + (await params).artistId },
      { status: 404 }
    );
  }
}

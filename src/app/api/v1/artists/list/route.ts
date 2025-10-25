import { NextResponse } from "next/server";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";

export async function GET() {
  try {
    const artists = await fetchArtistsFromCms({});

    return NextResponse.json(artists, { status: 200 });
  } catch (error) {
    console.error("Error fetching artists from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}

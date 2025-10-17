import { NextResponse } from "next/server";
import { fetchArtistFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const venue = await fetchArtistFromCms(uid);

    return NextResponse.json(venue, { status: 200 });
  } catch (error) {
    console.error("Error fetching artist from Prismic:", error);
    return NextResponse.json(
      { error: "Artist not found" + (await params).uid },
      { status: 404 }
    );
  }
}

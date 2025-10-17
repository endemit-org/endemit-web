import { NextResponse } from "next/server";
import { fetchPodcastFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const podcast = await fetchPodcastFromCms(uid);

    return NextResponse.json(podcast, { status: 200 });
  } catch (error) {
    console.error("Error fetching venue from Prismic:", error);
    return NextResponse.json(
      { error: "Podcast not found" + (await params).uid },
      { status: 404 }
    );
  }
}

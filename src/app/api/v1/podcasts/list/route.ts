import { NextResponse } from "next/server";
import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";

export async function GET() {
  try {
    const podcasts = await fetchPodcastsFromCms({});

    return NextResponse.json(podcasts, { status: 200 });
  } catch (error) {
    console.error("Error fetching podcats from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcats" },
      { status: 500 }
    );
  }
}

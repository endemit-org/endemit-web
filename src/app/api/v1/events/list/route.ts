import { NextResponse } from "next/server";
import { fetchEventsFromCms } from "@/domain/cms/actions";

export async function GET() {
  try {
    const events = await fetchEventsFromCms({});

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("Error fetching events from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

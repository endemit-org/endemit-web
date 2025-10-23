import { NextResponse } from "next/server";
import { fetchVenuesFromCms } from "@/domain/cms/operations/fetchVenuesFromCms";

export async function GET() {
  try {
    const venues = await fetchVenuesFromCms({});

    return NextResponse.json(venues, { status: 200 });
  } catch (error) {
    console.error("Error fetching venues from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}

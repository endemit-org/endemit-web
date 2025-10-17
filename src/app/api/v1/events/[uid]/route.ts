import { NextResponse } from "next/server";
import { fetchEventFromCmsByUid } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const product = await fetchEventFromCmsByUid(uid);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching event from Prismic:", error);
    return NextResponse.json(
      { error: "Event not found" + (await params).uid },
      { status: 404 }
    );
  }
}

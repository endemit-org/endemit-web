import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { previewStickerLink } from "@/domain/sticker/operations/previewStickerLink";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("code") ?? "";

    const result = await previewStickerLink(raw, user.id);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to preview sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

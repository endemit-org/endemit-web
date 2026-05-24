import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { getUserSticker } from "@/domain/sticker/operations/getUserSticker";
import { unlinkSticker } from "@/domain/sticker/operations/unlinkSticker";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const sticker = await getUserSticker(user.id);
    return NextResponse.json({
      sticker: sticker
        ? {
            code: sticker.code,
            claimedAt: sticker.claimedAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await unlinkSticker(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unlink sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { linkSticker } from "@/domain/sticker/operations/linkSticker";
import { notifyOnStickerConflict } from "@/domain/notification/operations/notifyOnStickerConflict";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const raw = typeof body?.code === "string" ? body.code : "";

    const result = await linkSticker(raw, user.id);

    if (result.status === "conflict_other") {
      notifyOnStickerConflict({
        code: result.code,
        attemptingUserId: user.id,
        attemptingUserName: user.name,
        attemptingUserEmail: user.email,
        ownerUserId: result.otherUserId,
      }).catch(() => {});

      return NextResponse.json({
        status: "conflict_other",
        code: result.code,
      });
    }

    if (result.status === "swap_required") {
      return NextResponse.json({
        status: "swap_required",
        code: result.code,
        existingCode: result.existingCode,
      });
    }

    if (result.status === "already_yours") {
      return NextResponse.json({
        status: "already_yours",
        code: result.code,
      });
    }

    return NextResponse.json({
      status: "linked",
      code: result.code,
      claimedAt: result.claimedAt.toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to link sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  isStickerCodeProperty,
  updateStickerProperty,
} from "@/domain/sticker/operations/updateStickerProperty";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { code } = await params;
    const body = await request.json();

    const rawProperty = body?.property ?? null;
    if (rawProperty !== null && !isStickerCodeProperty(rawProperty)) {
      return NextResponse.json({ error: "Invalid property" }, { status: 400 });
    }

    await updateStickerProperty(code, rawProperty);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

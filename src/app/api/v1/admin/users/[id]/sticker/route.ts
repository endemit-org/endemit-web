import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { assignSticker } from "@/domain/sticker/operations/assignSticker";
import { unlinkUserSticker } from "@/domain/sticker/operations/unlinkUserSticker";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";

    const result = await assignSticker(code, targetUserId);

    return NextResponse.json({
      code: result.code,
      userId: result.userId,
      claimedAt: result.claimedAt.toISOString(),
      replacedCode: result.replacedCode,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const unlinkedCode = await unlinkUserSticker(targetUserId);

    return NextResponse.json({ unlinkedCode });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unlink sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

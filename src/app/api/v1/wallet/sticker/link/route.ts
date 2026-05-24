import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { linkSticker } from "@/domain/sticker/operations/linkSticker";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";

    const result = await linkSticker(code, user.id);

    return NextResponse.json({
      code: result.code,
      claimedAt: result.claimedAt.toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to link sticker";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

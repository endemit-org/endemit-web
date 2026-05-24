import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import {
  listStickers,
  type StickerListFilter,
} from "@/domain/sticker/operations/listStickers";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawFilter = searchParams.get("filter") ?? "all";
    const filter: StickerListFilter =
      rawFilter === "claimed" || rawFilter === "unclaimed" ? rawFilter : "all";

    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "50");

    const result = await listStickers({ filter, search, page, pageSize });

    return NextResponse.json({
      items: result.items.map(s => ({
        code: s.code,
        userId: s.userId,
        claimedAt: s.claimedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        user: s.user,
      })),
      total: result.total,
      claimedCount: result.claimedCount,
      unclaimedCount: result.unclaimedCount,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list stickers";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

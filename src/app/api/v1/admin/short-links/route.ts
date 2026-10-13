import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createShortLink } from "@/domain/shortLink/operations/createShortLink";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.SHORT_LINKS_WRITE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const link = await createShortLink(
      {
        code: typeof body?.code === "string" ? body.code : undefined,
        targetUrl: String(body?.targetUrl ?? ""),
        description:
          typeof body?.description === "string" ? body.description : undefined,
        isActive: typeof body?.isActive === "boolean" ? body.isActive : true,
      },
      user.id
    );

    return NextResponse.json({ success: true, code: link.code });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create short link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

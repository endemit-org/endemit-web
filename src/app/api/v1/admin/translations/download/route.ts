import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { buildMergedMessages } from "@/domain/translation/operations/buildMergedMessages";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.permissions.includes(PERMISSIONS.TRANSLATIONS_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  if (locale !== "en" && locale !== "sl") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const merged = await buildMergedMessages(locale);
  // Match the repo files: 2-space indent + trailing newline for a clean diff
  const body = JSON.stringify(merged, null, 2) + "\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${locale}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

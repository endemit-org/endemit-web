import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateShortLink } from "@/domain/shortLink/operations/updateShortLink";
import { deleteShortLink } from "@/domain/shortLink/operations/deleteShortLink";

async function requireWriteAccess() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!user.permissions.includes(PERMISSIONS.SHORT_LINKS_WRITE)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireWriteAccess();
    if (access.error) return access.error;

    const { id } = await params;
    const body = await request.json();

    await updateShortLink(id, {
      code: typeof body?.code === "string" ? body.code : undefined,
      targetUrl:
        typeof body?.targetUrl === "string" ? body.targetUrl : undefined,
      description:
        typeof body?.description === "string" ? body.description : undefined,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update short link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireWriteAccess();
    if (access.error) return access.error;

    const { id } = await params;
    await deleteShortLink(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete short link";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

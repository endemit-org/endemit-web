import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { approveEventClaimNow } from "@/domain/claim/operations/approveEventClaimNow";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.EVENT_CLAIMS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const claim = await approveEventClaimNow(id);

    return NextResponse.json({
      claim: {
        id: claim.id,
        status: claim.status,
        approvedAt: claim.approvedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve claim";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

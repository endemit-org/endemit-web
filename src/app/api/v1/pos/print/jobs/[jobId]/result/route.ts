import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

// The seller's browser reports the outcome of a direct-to-printer ePOS push.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { jobId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    await prisma.posPrintJob.update({
      where: { id: jobId },
      data: body.success
        ? { status: "PRINTED", printedAt: new Date(), lastError: null }
        : {
            status: "FAILED",
            lastError: (body.error ?? "Print failed").slice(0, 300),
          },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report POS print result error:", error);
    return NextResponse.json(
      { error: "Failed to report print result" },
      { status: 400 }
    );
  }
}

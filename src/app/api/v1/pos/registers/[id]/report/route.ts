import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getPosRegisterReport } from "@/domain/pos/operations/getPosRegisterReport";
import { getPosRegisterPayouts } from "@/domain/pos/operations/getPosRegisterPayouts";

// Register statistics for assigned sellers — same numbers the admin
// report shows, plus current outstanding tips/cash.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const assignment = await prisma.posRegisterSeller.findUnique({
      where: {
        registerId_userId: {
          registerId: id,
          userId: user.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Not assigned to this register" },
        { status: 403 }
      );
    }

    const [report, payouts] = await Promise.all([
      getPosRegisterReport(id),
      getPosRegisterPayouts(id),
    ]);

    return NextResponse.json({
      report,
      outstandingTips: payouts.outstandingTips,
      outstandingCash: payouts.outstandingCash,
    });
  } catch (error) {
    console.error("POS register report error:", error);
    return NextResponse.json(
      { error: "Failed to load report" },
      { status: 500 }
    );
  }
}

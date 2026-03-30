import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { processCashTopup } from "@/domain/pos/operations/processCashTopup";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.permissions.includes(PERMISSIONS.POS_TOPUP)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { registerId, customerWalletId, amount } = body;

    if (!registerId || !customerWalletId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const result = await processCashTopup({
      registerId,
      sellerId: user.id,
      customerWalletId,
      amount,
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        balanceAfter: result.transaction.balanceAfter,
      },
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error("Cash top-up error:", error);
    const message = error instanceof Error ? error.message : "Failed to process top-up";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { resolveScanTarget } from "@/domain/wallet/util/resolveScanTarget";
import { getWalletByUserIdFresh } from "@/domain/wallet/operations/getWalletByUserId";

const TRANSACTIONS_SHOWN = 5;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.POS_ACCESS)) {
      return NextResponse.json(
        { error: "Not authorized to check balances" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const { userId } = await resolveScanTarget(code);
    const wallet = await getWalletByUserIdFresh(userId);
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      customer: {
        name: wallet.user?.name || wallet.user?.username || null,
      },
      balance: wallet.balance,
      transactions: wallet.transactions
        .slice(0, TRANSACTIONS_SHOWN)
        .map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          note: tx.note,
          createdAt: tx.createdAt,
        })),
    });
  } catch (error) {
    console.error("POS balance check error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check balance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

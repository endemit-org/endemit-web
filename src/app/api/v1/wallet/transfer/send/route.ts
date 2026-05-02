import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { transferFunds } from "@/domain/wallet/operations/transferFunds";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const recipientUserId =
      typeof body?.recipientUserId === "string" ? body.recipientUserId : "";
    const amount = typeof body?.amount === "number" ? body.amount : NaN;
    const idempotencyKey =
      typeof body?.idempotencyKey === "string" ? body.idempotencyKey : "";
    const note = typeof body?.note === "string" ? body.note.slice(0, 200) : undefined;

    if (!recipientUserId) {
      return NextResponse.json(
        { error: "Missing recipient" },
        { status: 400 }
      );
    }

    const result = await transferFunds({
      senderUserId: user.id,
      recipientUserId,
      amount,
      idempotencyKey,
      note,
    });

    return NextResponse.json({
      transactionId: result.debit.id,
      balanceAfter: result.debit.balanceAfter,
      amount: Math.abs(result.debit.amount),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send funds";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

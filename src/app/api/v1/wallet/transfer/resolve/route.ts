import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { resolveTransferRecipient } from "@/domain/wallet/operations/resolveTransferRecipient";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const value = typeof body?.value === "string" ? body.value : "";
    if (!value) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const recipient = await resolveTransferRecipient(value);

    if (recipient.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot send funds to yourself" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      userId: recipient.userId,
      username: recipient.username,
      name: recipient.name,
      image: recipient.image,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve recipient";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

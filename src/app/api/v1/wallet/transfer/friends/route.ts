import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { getTransferCounterparties } from "@/domain/wallet/operations/getTransferCounterparties";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friends = await getTransferCounterparties(user.id);
    return NextResponse.json({ friends });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load friends";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

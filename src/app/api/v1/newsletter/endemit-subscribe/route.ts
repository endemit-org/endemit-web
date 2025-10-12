import { NextResponse } from "next/server";
import assert from "node:assert";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    assert(email, "Email is required");

    const subscriptionResponse = await subscribeEmailToGeneralList(email);

    return NextResponse.json(subscriptionResponse);
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

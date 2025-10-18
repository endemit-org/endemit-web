import { NextResponse } from "next/server";
import assert from "node:assert";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions";
import { notifyOnNewSubscriber } from "@/domain/notification/actions";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    assert(email, "Email is required");

    const subscriptionResponse = await subscribeEmailToGeneralList(email);
    if (subscriptionResponse) {
      await notifyOnNewSubscriber(email, "General Newsletter");
    }

    return NextResponse.json(subscriptionResponse);
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

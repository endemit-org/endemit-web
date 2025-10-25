import { NextResponse } from "next/server";
import assert from "node:assert";
import { subscribeEmailToFestivalList } from "@/domain/newsletter/actions/subscribeEmailToFestivalList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    assert(email, "Email is required");

    const subscriptionResponse = await subscribeEmailToFestivalList(email);
    if (subscriptionResponse) {
      await notifyOnNewSubscriber(email, "Festival Newsletter");
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

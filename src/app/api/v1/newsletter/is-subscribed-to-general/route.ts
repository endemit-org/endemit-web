import { NextResponse } from "next/server";
import assert from "node:assert";
import { isEmailSubscribedToGeneralList } from "@/domain/newsletter/actions/isSubscribedToGeneralList";
import {
  RATE_LIMITED_MESSAGE,
  consumeClientRateLimit,
} from "@/lib/services/rateLimit";

export async function POST(request: Request) {
  try {
    // Limits probing which emails are on the list.
    if (
      !(await consumeClientRateLimit("newsletter-check", {
        limit: 30,
        windowMs: 10 * 60 * 1000,
      }))
    ) {
      return NextResponse.json(
        { success: false, error: RATE_LIMITED_MESSAGE },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    assert(email, "Email is required");

    const subscriptionResponse = await isEmailSubscribedToGeneralList(email);

    return NextResponse.json(subscriptionResponse);
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

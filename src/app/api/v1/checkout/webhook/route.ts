import { stripe } from "@/services/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  onOrderPaymentExpired,
  onOrderPaymentComplete,
} from "@/domain/order/actions";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook error ${err}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        await onOrderPaymentComplete(session.id);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;

        await onOrderPaymentExpired(session.id);
        break;
      }

      case "payment_intent.succeeded": {
        // If we want to handle capturing of funds
        break;
      }

      case "payment_intent.payment_failed": {
        // If we want to handle capturing of funds
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

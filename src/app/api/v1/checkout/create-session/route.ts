import { NextResponse } from "next/server";
import { fetchProductsFromCms } from "@/domain/cms/actions";
import { validateCheckoutRequest } from "@/domain/checkout/actions";
import { createOrder } from "@/domain/order/actions";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions";
import { createCheckoutSession } from "@/domain/checkout/actions/createCheckoutSession";
import { createCheckoutSessionLineItems } from "@/domain/checkout/actions/createCheckoutSessionLineItems";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const products = await fetchProductsFromCms({});

    const {
      email,
      checkoutItems,
      orderWeight,
      shippingAddress,
      discountCodeId,
      subscribeToNewsletter,
      complementaryTicketData,
      shouldHaveShippingAddress,
      subtotal,
      shippingCost,
    } = validateCheckoutRequest(body, products);

    const lineItems = createCheckoutSessionLineItems({
      checkoutItems,
      shippingAddress,
      shouldHaveShippingAddress,
      orderWeight,
      complementaryTicketData,
    });

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      lineItems,
      discountCodeId,
      email,
      shippingAddress,
    });

    await createOrder({
      stripeSessionId: session.id,
      email,
      subtotal,
      shippingCost,
      shippingRequired: shouldHaveShippingAddress,
      shippingAddress: shippingAddress,
      checkoutItems: lineItems,
    });

    if (subscribeToNewsletter) {
      await subscribeEmailToGeneralList(email);
    }

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}

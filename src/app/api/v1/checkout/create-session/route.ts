import { NextResponse } from "next/server";

import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { validateCheckoutRequest } from "@/domain/checkout/operations/validateCheckoutRequest";
import { transformToCheckoutSessionLineItems } from "@/domain/checkout/transformers/transformToCheckoutSessionLineItems";
import { createCheckoutSession } from "@/domain/checkout/operations/createCheckoutSession";
import { createOrder } from "@/domain/order/operations/createOrder";
import { transformToProductInOrder } from "@/domain/product/transformers/transformToProductInOrder";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions/subscribeEmailToGeneralList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";
import { transformPriceFromStripe } from "@/domain/checkout/transformers/transformPriceFromStripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const products = await fetchProductsFromCms({});

    if (!products || products.length === 0) {
      throw new Error("No products available for checkout");
    }

    const {
      name,
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

    const lineItems = transformToCheckoutSessionLineItems({
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
      name: name ?? undefined,
      email,
      subtotal,
      shippingCost,
      discountAmount: session.total_details?.amount_discount
        ? transformPriceFromStripe(session.total_details.amount_discount) * -1
        : 0,
      shippingRequired: shouldHaveShippingAddress,
      shippingAddress,
      orderItems: checkoutItems.map(checkoutItem =>
        transformToProductInOrder(checkoutItem, complementaryTicketData)
      ),
    });

    if (subscribeToNewsletter) {
      const subscriptionResponse = await subscribeEmailToGeneralList(email);
      if (subscriptionResponse) {
        await notifyOnNewSubscriber(email, "General Newsletter");
      }
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

import { NextResponse } from "next/server";
import { fetchProductsFromCms } from "@/domain/cms/actions";
import { validateCheckoutRequest } from "@/domain/checkout/actions";
import { createOrder } from "@/domain/order/actions";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions";
import { transformToProductInOrder } from "@/domain/product/actions";
import { transformPriceFromStripe } from "@/services/stripe/util";
import { notifyOnNewSubscriber } from "@/domain/notification/actions";
import { createCheckoutSessionLineItems } from "@/domain/checkout/actions/createCheckoutSessionLineItems";
import { createCheckoutSession } from "@/domain/checkout/actions/createCheckoutSession";

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

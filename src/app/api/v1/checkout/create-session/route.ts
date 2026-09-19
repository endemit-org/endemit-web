import { NextResponse } from "next/server";

import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { validateCheckoutRequest } from "@/domain/checkout/operations/validateCheckoutRequest";
import { resolvePickupSelection } from "@/domain/checkout/operations/resolvePickupSelection";
import { DeliveryMethod } from "@/domain/checkout/types/checkout";
import { transformToCheckoutSessionLineItems } from "@/domain/checkout/transformers/transformToCheckoutSessionLineItems";
import { createCheckoutSession } from "@/domain/checkout/operations/createCheckoutSession";
import { createOrder } from "@/domain/order/operations/createOrder";
import { transformToProductInOrder } from "@/domain/product/transformers/transformToProductInOrder";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions/subscribeEmailToGeneralList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";
import { transformPriceFromStripe } from "@/domain/checkout/transformers/transformPriceFromStripe";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserIdFresh } from "@/domain/wallet/operations/getWalletByUserId";
import { isValidWalletCreditAmount } from "@/domain/checkout/businessRules";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const products = await fetchProductsFromCms({});
    const currentUser = await getCurrentUser();

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
      complementaryTicketData,
      shouldHaveShippingAddress,
      deliveryMethod,
      pickupEventUid,
      subtotal,
      shippingCost,
      walletCreditAmount,
    } = validateCheckoutRequest(body, products);

    const pickup = await resolvePickupSelection(deliveryMethod, pickupEventUid);
    const isPickup = deliveryMethod === DeliveryMethod.PICKUP;

    // Validate wallet credit if provided
    let validatedWalletCredit = 0;
    if (walletCreditAmount > 0 && currentUser) {
      const wallet = await getWalletByUserIdFresh(currentUser.id);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Calculate total in cents for validation
      const totalCents = Math.round((subtotal + shippingCost) * 100);

      if (
        !isValidWalletCreditAmount(
          walletCreditAmount,
          totalCents,
          wallet.balance
        )
      ) {
        throw new Error("Invalid wallet credit amount");
      }

      validatedWalletCredit = walletCreditAmount;
    }

    const lineItems = transformToCheckoutSessionLineItems({
      checkoutItems,
      shippingAddress,
      // Pickup adds no shipping line item
      shouldHaveShippingAddress: shouldHaveShippingAddress && !isPickup,
      orderWeight,
      complementaryTicketData,
    });

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      lineItems,
      discountCodeId,
      email,
      shippingAddress,
      pickup,
      walletCreditAmount: validatedWalletCredit,
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
      walletAmountUsed: validatedWalletCredit,
      shippingRequired: shouldHaveShippingAddress,
      shippingAddress,
      deliveryMethod,
      pickup,
      orderItems: checkoutItems.map(checkoutItem =>
        transformToProductInOrder(checkoutItem, complementaryTicketData)
      ),
      userId: currentUser?.id,
      locale: body.locale === "en" ? "en" : "sl",
    });

    // Subscribe all customers to general email list
    const subscriptionResponse = await subscribeEmailToGeneralList(email);
    if (subscriptionResponse.success && subscriptionResponse.isNew) {
      await notifyOnNewSubscriber(email, "General Newsletter");
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

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
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
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
      subscribeToNewsletter,
      complementaryTicketData,
      shouldHaveShippingAddress,
      subtotal,
      shippingCost,
      walletCreditAmount,
    } = validateCheckoutRequest(body, products);

    // Validate wallet credit if provided
    let validatedWalletCredit = 0;
    if (walletCreditAmount > 0 && currentUser) {
      const wallet = await getWalletByUserId(currentUser.id);
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
      orderItems: checkoutItems.map(checkoutItem =>
        transformToProductInOrder(checkoutItem, complementaryTicketData)
      ),
      userId: currentUser?.id,
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

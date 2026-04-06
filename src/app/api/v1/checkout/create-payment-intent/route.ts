import { NextResponse } from "next/server";

import { prisma } from "@/lib/services/prisma";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { validateCheckoutRequest } from "@/domain/checkout/operations/validateCheckoutRequest";
import { createOrder } from "@/domain/order/operations/createOrder";
import { getOrderByStripeSession } from "@/domain/order/operations/getOrderByStripeSession";
import { transformToProductInOrder } from "@/domain/product/transformers/transformToProductInOrder";
import { subscribeEmailToGeneralList } from "@/domain/newsletter/actions/subscribeEmailToGeneralList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { isValidWalletCreditAmount } from "@/domain/checkout/businessRules";
import { validatePromoCode } from "@/domain/checkout/operations/validatePromoCode";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { processFullWalletPayment } from "@/domain/checkout/operations/processFullWalletPayment";
import { stripe } from "@/lib/services/stripe";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { transformToCheckoutDescription } from "@/domain/checkout/transformers/transformToCheckoutDescription";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;
    const products = await fetchProductsFromCms({});
    const currentUser = await getCurrentUser();

    if (!products || products.length === 0) {
      throw new Error("No products available for checkout");
    }

    const {
      name,
      email,
      checkoutItems,
      shippingAddress,
      complementaryTicketData,
      shouldHaveShippingAddress,
      subtotal,
      shippingCost,
      walletCreditAmount,
    } = validateCheckoutRequest(body, products);

    // Validate and calculate discount if provided
    let discount: DiscountDetails | undefined;
    let discountAmount = 0;

    if (body.promoCode) {
      try {
        const { coupon, foundPromoCode } = await validatePromoCode(
          body.promoCode,
          subtotal
        );
        discount = {
          success: true,
          promoCodeKey: body.promoCode,
          promoCodeId: foundPromoCode.id,
          coupon: {
            id: coupon.id,
            percent_off: coupon.percent_off ?? undefined,
            amount_off: coupon.amount_off ?? undefined,
          },
          restrictions: foundPromoCode.restrictions,
        };
      } catch {
        // Invalid promo code - continue without discount
        console.warn("Invalid promo code provided:", body.promoCode);
      }
    }

    // Calculate totals with discount
    const totals = getCheckoutTotals({
      subTotal: subtotal,
      discount,
      shippingCost,
    });
    discountAmount = totals.discountAmount;

    // Validate wallet credit if provided
    let validatedWalletCredit = 0;
    if (walletCreditAmount > 0 && currentUser) {
      const wallet = await getWalletByUserId(currentUser.id);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Calculate total in cents for validation (after discount)
      const totalCents = Math.round(totals.total * 100);

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

    // Calculate final amount to charge (in cents)
    const totalInCents = Math.round(totals.total * 100);
    const amountToCharge = Math.max(0, totalInCents - validatedWalletCredit);

    // Check if order already exists for this payment intent (idempotency)
    let order;
    if (paymentIntentId) {
      const existingOrder = await getOrderByStripeSession(paymentIntentId);
      if (existingOrder) {
        order = existingOrder;
      }
    }

    // Create order if it doesn't exist
    if (!order) {
      const result = await createOrder({
        stripeSessionId: paymentIntentId || `order_${Date.now()}`,
        name: name ?? undefined,
        email,
        subtotal,
        shippingCost,
        discountAmount,
        walletAmountUsed: validatedWalletCredit,
        shippingRequired: shouldHaveShippingAddress,
        shippingAddress,
        orderItems: checkoutItems.map(checkoutItem =>
          transformToProductInOrder(checkoutItem, complementaryTicketData)
        ),
        userId: currentUser?.id,
      });
      order = result.order;
    }

    // Subscribe all customers to general email list
    const subscriptionResponse = await subscribeEmailToGeneralList(email);
    if (subscriptionResponse.success) {
      await notifyOnNewSubscriber(email, "General Newsletter");
    }

    // If full wallet payment (no card needed)
    if (amountToCharge === 0) {
      const processedOrder = await processFullWalletPayment(order.id);

      return NextResponse.json(
        {
          fullWalletPayment: true,
          orderId: processedOrder.id,
        },
        { status: 200 }
      );
    }

    // Get ticket holders from complementaryTicketData
    const ticketHolders = complementaryTicketData
      ? Object.values(complementaryTicketData).filter(Boolean)
      : undefined;

    // Build metadata for PaymentIntent
    const metadata: Record<string, string> = {
      orderId: order.id,
      requiresShipping: shippingAddress ? "true" : "false",
      includesTickets: ticketHolders ? "true" : "false",
      walletCreditAmount: validatedWalletCredit.toString(),
    };

    if (ticketHolders) {
      metadata.ticketHolders = JSON.stringify(ticketHolders);
    }

    if (shippingAddress) {
      metadata.shippingName = shippingAddress.name;
      metadata.shippingAddressLine1 = shippingAddress.address;
      metadata.shippingCity = shippingAddress.city;
      metadata.shippingPostalCode = shippingAddress.postalCode;
      metadata.shippingCountry = shippingAddress.country;
      metadata.shippingPhone = shippingAddress.phone;
      metadata.shippingEmail = email;
    }

    // Update existing PaymentIntent with order info
    if (paymentIntentId) {
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: amountToCharge,
        receipt_email: email,
        description: transformToCheckoutDescription(shippingAddress, email),
        metadata,
      });

      return NextResponse.json(
        {
          paymentIntentId,
          orderId: order.id,
        },
        { status: 200 }
      );
    }

    // Fallback: create new PaymentIntent if none provided
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: "eur",
      receipt_email: email,
      description: transformToCheckoutDescription(shippingAddress, email),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with the actual payment intent ID so webhook can find it
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSession: paymentIntent.id },
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment intent",
      },
      { status: 500 }
    );
  }
}

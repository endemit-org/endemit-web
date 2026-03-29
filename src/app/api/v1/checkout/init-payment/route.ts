import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { validatePromoCode } from "@/domain/checkout/operations/validatePromoCode";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { stripe } from "@/lib/services/stripe";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { getCalculatedShippingCost } from "@/domain/checkout/actions/getCalculatedShippingCost";
import { getCheckoutWeight } from "@/domain/checkout/actions/getCheckoutWeight";
import { includesShippableProduct } from "@/domain/checkout/businessRules";
import { CountryCode } from "@/domain/checkout/types/country";

interface InitPaymentRequest {
  items: CartItem[];
  country?: string;
  promoCode?: string;
  walletCreditAmount?: number;
}

export async function POST(request: Request) {
  try {
    const body: InitPaymentRequest = await request.json();
    const { items, country, promoCode, walletCreditAmount = 0 } = body;

    if (!items || items.length === 0) {
      throw new Error("Cart is empty");
    }

    const currentUser = await getCurrentUser();

    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate shipping
    const requiresShipping = includesShippableProduct(items);
    const orderWeight = getCheckoutWeight(items);

    // Create minimal shipping address for cost calculation
    const shippingForCalc = country
      ? {
          name: "",
          address: "",
          city: "",
          postalCode: "",
          country: country as CountryCode,
          phone: "",
        }
      : undefined;

    const shippingCost = getCalculatedShippingCost(
      requiresShipping,
      shippingForCalc,
      items,
      orderWeight
    );

    // Validate promo code if provided
    let discount: DiscountDetails | undefined;
    if (promoCode) {
      try {
        const { coupon, foundPromoCode } = await validatePromoCode(
          promoCode,
          subtotal
        );
        discount = {
          success: true,
          promoCodeKey: promoCode,
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
      }
    }

    // Calculate totals
    const totals = getCheckoutTotals({
      subTotal: subtotal,
      discount,
      shippingCost,
    });

    // Validate wallet credit if provided
    let validatedWalletCredit = 0;
    if (walletCreditAmount > 0 && currentUser) {
      const wallet = await getWalletByUserId(currentUser.id);
      if (wallet) {
        const totalCents = Math.round(totals.total * 100);
        const maxCredit = Math.min(wallet.balance, totalCents);
        validatedWalletCredit = Math.min(walletCreditAmount, maxCredit);
      }
    }

    // Calculate final amount to charge (in cents)
    const totalInCents = Math.round(totals.total * 100);
    const amountToCharge = Math.max(0, totalInCents - validatedWalletCredit);

    // If full wallet payment, no need for PaymentIntent
    if (amountToCharge === 0) {
      return NextResponse.json(
        {
          fullWalletPayment: true,
          amount: 0,
        },
        { status: 200 }
      );
    }

    // Create PaymentIntent (without order - order created on confirm)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        status: "initialized",
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Failed to create payment intent");
    }

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountToCharge,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initializing payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initialize payment",
      },
      { status: 500 }
    );
  }
}

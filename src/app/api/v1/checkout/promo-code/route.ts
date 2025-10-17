import assert from "node:assert";
import { NextResponse } from "next/server";
import { CheckoutValidationService } from "@/services/validation/validation.service";
import { validatePromoCode } from "@/domain/checkout/actions/validatePromoCode";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const promoCode = body.promoCode as string;
    const subtotal = body.subtotal as number; // Should be in euros

    assert(promoCode, "Promo code is required");
    assert(
      CheckoutValidationService.isValidDiscountCodeFormat(promoCode),
      "Invalid promo code format"
    );
    assert(
      subtotal > 0,
      "Cart subtotal value is required and must be greater than 0"
    );

    const { foundPromoCode, coupon } = await validatePromoCode(
      promoCode,
      subtotal
    );

    return NextResponse.json(
      {
        success: true,
        valid: true,
        promoCodeId: foundPromoCode.id,
        promoCodeKey: promoCode,
        coupon: {
          id: coupon.id,
          percent_off: coupon.percent_off,
          amount_off: coupon.amount_off,
        },
        restrictions: foundPromoCode.restrictions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate promo code",
      },
      { status: 200 }
    );
  }
}

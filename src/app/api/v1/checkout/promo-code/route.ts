import assert from "node:assert";
import { NextResponse } from "next/server";
import { CheckoutValidationService } from "@/lib/services/validation/validation.service";
import { validateDiscountCode } from "@/domain/discount/operations/validateDiscountCode";
import type { DiscountCartItem } from "@/domain/discount/types/discount";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const promoCode = body.promoCode as string;
    const subtotal = body.subtotal as number; // In euros
    const shippingCost = (body.shippingCost as number) ?? 0; // In euros
    const items = (body.items as DiscountCartItem[]) ?? [];

    assert(promoCode, "Promo code is required");
    assert(
      CheckoutValidationService.isValidDiscountCodeFormat(promoCode),
      "Invalid promo code format"
    );
    assert(
      subtotal > 0,
      "Cart subtotal value is required and must be greater than 0"
    );

    const { rule } = await validateDiscountCode(promoCode, {
      items: items.map(item => ({
        uid: item.uid,
        price: item.price,
        quantity: item.quantity,
      })),
      subTotal: subtotal,
      shippingCost,
    });

    return NextResponse.json(
      {
        success: true,
        valid: true,
        ...rule,
        promoCodeId: rule.id,
        promoCodeKey: rule.code,
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

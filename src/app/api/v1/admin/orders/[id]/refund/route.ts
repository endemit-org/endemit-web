import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { processRefund } from "@/domain/order/operations/processRefund";
import { RefundItemSelection } from "@/domain/order/operations/calculateRefundLimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for ORDERS_REFUND permission
    if (!user.permissions.includes(PERMISSIONS.ORDERS_REFUND)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const items = body.items as RefundItemSelection[];
    const includeShipping = body.includeShipping as boolean | undefined;
    const reason = body.reason as string | undefined;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty items array" },
        { status: 400 }
      );
    }

    // Validate item structure
    for (const item of items) {
      if (typeof item.itemIndex !== "number" || typeof item.quantity !== "number") {
        return NextResponse.json(
          { error: "Invalid item structure: each item must have itemIndex and quantity" },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Item quantity must be positive" },
          { status: 400 }
        );
      }
    }

    // Process the refund
    const result = await processRefund({
      orderId,
      adminUserId: user.id,
      items,
      includeShipping,
      reason,
      sendEmail: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Process refund error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import "server-only";

import { Order, OrderRefund } from "@prisma/client";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";

export interface RefundItemSelection {
  itemIndex: number;
  quantity: number;
}

export interface RefundSelectionInput {
  items: RefundItemSelection[];
  includeShipping?: boolean;
}

export interface RefundItemBreakdown {
  itemIndex: number;
  itemName: string;
  itemCategory: string;
  unitPrice: number;
  originalQuantity: number;
  alreadyRefunded: number;
  requestedQuantity: number;
  maxRefundableQuantity: number;
  maxRefundableAmount: number;
  limitReason: string | null;
}

export interface RefundLimitResult {
  maxRefundAmount: number;
  itemBreakdown: RefundItemBreakdown[];
  shippingRefundable: number;
  shippingAlreadyRefunded: boolean;
  limitedBy: "none" | "wallet_balance" | "already_refunded" | "quantity_exceeded";
  walletBalance: number | null;
  totalOrderAmount: number;
  totalAlreadyRefunded: number;
}

interface CalculateRefundLimitInput {
  order: Order & { refunds: OrderRefund[] };
  wallet: { balance: number } | null;
  selectedItems: RefundItemSelection[];
  includeShipping?: boolean;
}

/**
 * Calculate the maximum refund amount for selected items.
 * All amounts are in CENTS for Stripe compatibility.
 *
 * Key logic:
 * - For CURRENCIES items: limited by remaining wallet balance
 *   (e.g., bought 30€ credits, spent 20€, max refund = 10€)
 * - For other items: limited by what hasn't been refunded yet
 * - Tracks per-item breakdown with reasons
 */
export function calculateRefundLimit(
  input: CalculateRefundLimitInput
): RefundLimitResult {
  const { order, wallet, selectedItems } = input;
  const items = order.items as unknown as ProductInOrder[];

  // Calculate already refunded quantities per item index
  const refundedByItem = new Map<number, number>();
  for (const refund of order.refunds) {
    const current = refundedByItem.get(refund.itemIndex) ?? 0;
    refundedByItem.set(refund.itemIndex, current + refund.quantity);
  }

  const breakdown: RefundItemBreakdown[] = [];
  let totalRefundable = 0;
  let limitedBy: RefundLimitResult["limitedBy"] = "none";

  for (const selected of selectedItems) {
    const item = items[selected.itemIndex];
    if (!item) {
      continue; // Skip invalid item indices
    }

    // Convert item price from euros to cents
    const itemPriceCents = Math.round(item.price * 100);

    const alreadyRefunded = refundedByItem.get(selected.itemIndex) ?? 0;
    const remainingQuantity = item.quantity - alreadyRefunded;

    // Can't refund more than remaining
    const requestedQuantity = Math.min(selected.quantity, remainingQuantity);

    if (requestedQuantity <= 0) {
      breakdown.push({
        itemIndex: selected.itemIndex,
        itemName: item.name,
        itemCategory: item.category,
        unitPrice: itemPriceCents,
        originalQuantity: item.quantity,
        alreadyRefunded,
        requestedQuantity: selected.quantity,
        maxRefundableQuantity: 0,
        maxRefundableAmount: 0,
        limitReason: "Already fully refunded",
      });
      limitedBy = "already_refunded";
      continue;
    }

    // For CURRENCIES items, limit by remaining wallet balance (both in cents)
    if (item.category === ProductCategory.CURRENCIES && wallet) {
      const maxAmountByWallet = wallet.balance; // cents
      const requestedAmount = itemPriceCents * requestedQuantity; // cents

      if (maxAmountByWallet <= 0) {
        breakdown.push({
          itemIndex: selected.itemIndex,
          itemName: item.name,
          itemCategory: item.category,
          unitPrice: itemPriceCents,
          originalQuantity: item.quantity,
          alreadyRefunded,
          requestedQuantity,
          maxRefundableQuantity: 0,
          maxRefundableAmount: 0,
          limitReason: "Wallet balance is zero - credits have been spent",
        });
        limitedBy = "wallet_balance";
        continue;
      }

      if (maxAmountByWallet < requestedAmount) {
        // Partial refund based on wallet balance
        const maxQuantity = Math.floor(maxAmountByWallet / itemPriceCents);
        const maxAmount = Math.min(maxAmountByWallet, maxQuantity * itemPriceCents);

        breakdown.push({
          itemIndex: selected.itemIndex,
          itemName: item.name,
          itemCategory: item.category,
          unitPrice: itemPriceCents,
          originalQuantity: item.quantity,
          alreadyRefunded,
          requestedQuantity,
          maxRefundableQuantity: maxQuantity,
          maxRefundableAmount: maxAmount,
          limitReason: `Limited by remaining wallet balance (${formatCents(wallet.balance)})`,
        });
        totalRefundable += maxAmount;
        limitedBy = "wallet_balance";
      } else {
        // Full refund available
        breakdown.push({
          itemIndex: selected.itemIndex,
          itemName: item.name,
          itemCategory: item.category,
          unitPrice: itemPriceCents,
          originalQuantity: item.quantity,
          alreadyRefunded,
          requestedQuantity,
          maxRefundableQuantity: requestedQuantity,
          maxRefundableAmount: requestedAmount,
          limitReason: null,
        });
        totalRefundable += requestedAmount;
      }
    } else {
      // Non-currency items - full refund available for remaining quantity (in cents)
      const maxAmount = itemPriceCents * requestedQuantity;

      breakdown.push({
        itemIndex: selected.itemIndex,
        itemName: item.name,
        itemCategory: item.category,
        unitPrice: itemPriceCents,
        originalQuantity: item.quantity,
        alreadyRefunded,
        requestedQuantity,
        maxRefundableQuantity: requestedQuantity,
        maxRefundableAmount: maxAmount,
        limitReason: alreadyRefunded > 0
          ? `${alreadyRefunded} of ${item.quantity} already refunded`
          : null,
      });
      totalRefundable += maxAmount;

      if (selected.quantity > remainingQuantity) {
        limitedBy = "quantity_exceeded";
      }
    }
  }

  // Calculate shipping refund (itemIndex = -1 represents shipping)
  const shippingAmountCents = order.shippingAmount
    ? Math.round(Number(order.shippingAmount) * 100)
    : 0;
  const shippingAlreadyRefunded = order.refunds.some(r => r.itemIndex === -1);
  let shippingRefundable = 0;

  if (input.includeShipping && shippingAmountCents > 0 && !shippingAlreadyRefunded) {
    shippingRefundable = shippingAmountCents;
    totalRefundable += shippingRefundable;
  }

  // Calculate totals
  const totalOrderAmount = Number(order.totalAmount) * 100; // Convert to cents
  const totalAlreadyRefunded = order.refundedAmount;

  return {
    maxRefundAmount: totalRefundable,
    itemBreakdown: breakdown,
    shippingRefundable,
    shippingAlreadyRefunded,
    limitedBy,
    walletBalance: wallet?.balance ?? null,
    totalOrderAmount,
    totalAlreadyRefunded,
  };
}

/**
 * Calculate refund limit for all items in an order.
 * Useful for showing the maximum possible refund.
 */
export function calculateMaxRefundForOrder(
  order: Order & { refunds: OrderRefund[] },
  wallet: { balance: number } | null,
  includeShipping: boolean = true
): RefundLimitResult {
  const items = order.items as unknown as ProductInOrder[];

  const selectedItems: RefundItemSelection[] = items.map((item, index) => ({
    itemIndex: index,
    quantity: item.quantity,
  }));

  return calculateRefundLimit({ order, wallet, selectedItems, includeShipping });
}

function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export interface RefundSplit {
  walletAmount: number; // Cents credited back to the wallet
  stripeAmount: number; // Cents refunded via Stripe
  walletUnavailableAmount: number; // Wallet-owed cents that cannot be returned (wallet gone)
}

interface CalculateRefundSplitInput {
  refundAmount: number; // Cents to refund now
  totalOrderAmount: number; // Cents
  walletAmountUsed: number; // Cents paid from wallet at checkout
  refundedAmount: number; // Cents already refunded (all destinations)
  walletRefundedAmount: number; // Cents already refunded to wallet
  hasWallet: boolean;
}

/**
 * Split a refund between wallet credit and Stripe, proportionally to how the
 * order was originally paid. Each side is capped by what was paid there and
 * not yet refunded there, so cumulative refunds across multiple partial
 * refunds can never over-refund either payment source.
 */
export function calculateRefundSplit(
  input: CalculateRefundSplitInput
): RefundSplit {
  const {
    refundAmount,
    totalOrderAmount,
    walletAmountUsed,
    refundedAmount,
    walletRefundedAmount,
    hasWallet,
  } = input;

  const stripePaid = Math.max(0, totalOrderAmount - walletAmountUsed);
  const stripeRefunded = Math.max(0, refundedAmount - walletRefundedAmount);
  const remainingWallet = Math.max(0, walletAmountUsed - walletRefundedAmount);
  const remainingStripe = Math.max(0, stripePaid - stripeRefunded);

  let walletAmount =
    walletAmountUsed > 0 && totalOrderAmount > 0
      ? Math.round((refundAmount * walletAmountUsed) / totalOrderAmount)
      : 0;

  // The card side can only absorb what was actually charged there
  walletAmount = Math.max(walletAmount, refundAmount - remainingStripe);
  walletAmount = Math.min(walletAmount, remainingWallet, refundAmount);

  const stripeAmount = Math.min(refundAmount - walletAmount, remainingStripe);

  if (!hasWallet && walletAmount > 0) {
    return {
      walletAmount: 0,
      stripeAmount,
      walletUnavailableAmount: walletAmount,
    };
  }

  return { walletAmount, stripeAmount, walletUnavailableAmount: 0 };
}

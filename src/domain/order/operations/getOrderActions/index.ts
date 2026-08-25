import { OrderStatus } from "@prisma/client";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductType, ProductCategory } from "@/domain/product/types/product";

export type OrderAction =
  | "mark_preparing"
  | "mark_in_delivery"
  | "mark_completed"
  | "request_refund"
  | "process_refund"
  | "cancel_refund_request"
  | "cancel_order";

export type ActionVariant = "default" | "destructive" | "warning";

/** i18n keys under `admin.orders.orderActions` — translated at render time. */
export type OrderActionMessageKey =
  | "cancelOrder"
  | "cancelOrderDesc"
  | "startPreparing"
  | "startPreparingDesc"
  | "markCompleted"
  | "markCompletedDesc"
  | "markCompletedPartialDesc"
  | "initiateRefund"
  | "initiateRefundDesc"
  | "markShipped"
  | "markShippedDesc"
  | "sendShippingEmail"
  | "markDelivered"
  | "markDeliveredDesc"
  | "processRefund"
  | "processRefundDesc"
  | "denyRefund"
  | "denyRefundDesc"
  | "refundMoreItems"
  | "refundMoreItemsDesc";

export interface OrderActionConfig {
  action: OrderAction;
  label: OrderActionMessageKey;
  description: OrderActionMessageKey;
  requiresConfirmation: boolean;
  variant: ActionVariant;
  permission?: string;
  showEmailCheckbox?: boolean;
  emailCheckboxLabel?: OrderActionMessageKey;
}

export interface OrderContext {
  status: OrderStatus;
  hasPhysicalItems: boolean;
  hasDigitalItems: boolean;
  hasCurrencyItems: boolean;
  hasTickets: boolean;
  totalAmount: number;
  refundedAmount: number;
}

/**
 * Build OrderContext from order data.
 * This is a helper to convert raw order data into the context format.
 */
export function buildOrderContext(order: {
  status: OrderStatus;
  items: ProductInOrder[];
  totalAmount: number;
  refundedAmount: number;
}): OrderContext {
  const items = order.items;

  return {
    status: order.status,
    hasPhysicalItems: items.some(item => item.type === ProductType.PHYSICAL),
    hasDigitalItems: items.some(item => item.type === ProductType.DIGITAL),
    hasCurrencyItems: items.some(
      item => item.category === ProductCategory.CURRENCIES
    ),
    hasTickets: items.some(item => item.category === ProductCategory.TICKETS),
    totalAmount: order.totalAmount,
    refundedAmount: order.refundedAmount,
  };
}

/**
 * Get available actions for an order based on its current context.
 * This function is reusable in admin UI and customer-facing pages.
 */
export function getOrderActions(context: OrderContext): OrderActionConfig[] {
  const actions: OrderActionConfig[] = [];

  switch (context.status) {
    case "CREATED":
      // Unpaid orders can only be cancelled
      actions.push({
        action: "cancel_order",
        label: "cancelOrder",
        description: "cancelOrderDesc",
        requiresConfirmation: true,
        variant: "destructive",
      });
      break;

    case "PAID":
      // Paid orders can progress or be refunded
      if (context.hasPhysicalItems) {
        // Physical items need to go through preparation
        actions.push({
          action: "mark_preparing",
          label: "startPreparing",
          description: "startPreparingDesc",
          requiresConfirmation: false,
          variant: "default",
        });
      } else {
        // Digital-only orders can go straight to completed
        actions.push({
          action: "mark_completed",
          label: "markCompleted",
          description: "markCompletedDesc",
          requiresConfirmation: false,
          variant: "default",
        });
      }

      actions.push({
        action: "request_refund",
        label: "initiateRefund",
        description: "initiateRefundDesc",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "PREPARING":
      // Order is being prepared, can be shipped or refunded
      actions.push({
        action: "mark_in_delivery",
        label: "markShipped",
        description: "markShippedDesc",
        requiresConfirmation: false,
        variant: "default",
        showEmailCheckbox: true,
        emailCheckboxLabel: "sendShippingEmail",
      });

      actions.push({
        action: "request_refund",
        label: "initiateRefund",
        description: "initiateRefundDesc",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "IN_DELIVERY":
      // Order is in delivery, can be marked as completed
      actions.push({
        action: "mark_completed",
        label: "markDelivered",
        description: "markDeliveredDesc",
        requiresConfirmation: false,
        variant: "default",
      });
      break;

    case "COMPLETED":
      // Completed orders can still be refunded
      actions.push({
        action: "request_refund",
        label: "initiateRefund",
        description: "initiateRefundDesc",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "REFUND_REQUESTED":
      // Pending refund can be processed or cancelled
      actions.push({
        action: "process_refund",
        label: "processRefund",
        description: "processRefundDesc",
        requiresConfirmation: true,
        variant: "destructive",
        permission: "orders:refund",
      });

      actions.push({
        action: "cancel_refund_request",
        label: "denyRefund",
        description: "denyRefundDesc",
        requiresConfirmation: true,
        variant: "default",
      });
      break;

    case "PARTIALLY_REFUNDED":
      // Partially refunded orders can have more items refunded or be completed
      actions.push({
        action: "request_refund",
        label: "refundMoreItems",
        description: "refundMoreItemsDesc",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });

      if (context.hasPhysicalItems) {
        actions.push({
          action: "mark_completed",
          label: "markCompleted",
          description: "markCompletedPartialDesc",
          requiresConfirmation: false,
          variant: "default",
        });
      }
      break;

    // Terminal states - no actions available
    case "CANCELLED":
    case "EXPIRED":
    case "REFUNDED":
    case "PROCESSING":
      // No actions for these states
      break;
  }

  return actions;
}

/**
 * Filter actions based on user permissions.
 */
export function filterActionsByPermissions(
  actions: OrderActionConfig[],
  userPermissions: string[]
): OrderActionConfig[] {
  return actions.filter(
    action => !action.permission || userPermissions.includes(action.permission)
  );
}

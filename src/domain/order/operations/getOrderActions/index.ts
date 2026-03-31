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

export interface OrderActionConfig {
  action: OrderAction;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  variant: ActionVariant;
  permission?: string;
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
        label: "Cancel Order",
        description: "Cancel this unpaid order",
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
          label: "Start Preparing",
          description: "Mark order as being prepared for shipping",
          requiresConfirmation: false,
          variant: "default",
        });
      } else {
        // Digital-only orders can go straight to completed
        actions.push({
          action: "mark_completed",
          label: "Mark Completed",
          description: "Mark order as completed",
          requiresConfirmation: false,
          variant: "default",
        });
      }

      actions.push({
        action: "request_refund",
        label: "Initiate Refund",
        description: "Start refund process for this order",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "PREPARING":
      // Order is being prepared, can be shipped or refunded
      actions.push({
        action: "mark_in_delivery",
        label: "Mark Shipped",
        description: "Order has been shipped",
        requiresConfirmation: false,
        variant: "default",
      });

      actions.push({
        action: "request_refund",
        label: "Initiate Refund",
        description: "Start refund process",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "IN_DELIVERY":
      // Order is in delivery, can be marked as completed
      actions.push({
        action: "mark_completed",
        label: "Mark Delivered",
        description: "Order has been delivered",
        requiresConfirmation: false,
        variant: "default",
      });
      break;

    case "COMPLETED":
      // Completed orders can still be refunded
      actions.push({
        action: "request_refund",
        label: "Initiate Refund",
        description: "Start refund process for completed order",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });
      break;

    case "REFUND_REQUESTED":
      // Pending refund can be processed or cancelled
      actions.push({
        action: "process_refund",
        label: "Process Refund",
        description: "Execute refund via Stripe",
        requiresConfirmation: true,
        variant: "destructive",
        permission: "orders:refund",
      });

      actions.push({
        action: "cancel_refund_request",
        label: "Deny Refund",
        description: "Deny refund and restore previous order status",
        requiresConfirmation: true,
        variant: "default",
      });
      break;

    case "PARTIALLY_REFUNDED":
      // Partially refunded orders can have more items refunded or be completed
      actions.push({
        action: "request_refund",
        label: "Refund More Items",
        description: "Process additional refunds for remaining items",
        requiresConfirmation: true,
        variant: "warning",
        permission: "orders:refund",
      });

      if (context.hasPhysicalItems) {
        actions.push({
          action: "mark_completed",
          label: "Mark Completed",
          description: "Mark order as completed despite partial refund",
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

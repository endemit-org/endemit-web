import { OrderStatus } from "@prisma/client";
import { OrderContext } from "@/domain/order/operations/getOrderActions";

/**
 * Valid status transitions for orders.
 * This defines what status changes are allowed from each state.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
    OrderStatus.EXPIRED,
  ],
  PROCESSING: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
  ],
  PAID: [
    OrderStatus.PREPARING,
    OrderStatus.COMPLETED,
    OrderStatus.REFUND_REQUESTED,
    OrderStatus.CANCELLED,
  ],
  PREPARING: [
    OrderStatus.IN_DELIVERY,
    OrderStatus.REFUND_REQUESTED,
  ],
  IN_DELIVERY: [
    OrderStatus.COMPLETED,
  ],
  COMPLETED: [
    OrderStatus.REFUND_REQUESTED,
  ],
  CANCELLED: [],
  EXPIRED: [],
  REFUND_REQUESTED: [
    // Can go back to previous state if refund is denied
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.COMPLETED,
    // Or forward to refunded states
    OrderStatus.PARTIALLY_REFUNDED,
    OrderStatus.REFUNDED,
  ],
  PARTIALLY_REFUNDED: [
    // Can request more refunds or be completed
    OrderStatus.REFUND_REQUESTED,
    OrderStatus.COMPLETED,
  ],
  REFUNDED: [],
};

/**
 * Check if a status transition is valid.
 */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the next logical status based on order context.
 * Used for automatic status progression.
 */
export function getNextStatus(context: OrderContext): OrderStatus | null {
  switch (context.status) {
    case "PAID":
      return context.hasPhysicalItems
        ? OrderStatus.PREPARING
        : OrderStatus.COMPLETED;

    case "PREPARING":
      return OrderStatus.IN_DELIVERY;

    case "IN_DELIVERY":
      return OrderStatus.COMPLETED;

    default:
      return null;
  }
}

/**
 * Get possible target statuses from current status.
 */
export function getPossibleTransitions(from: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}

/**
 * Validate a transition and throw an error if invalid.
 */
export function validateTransition(
  from: OrderStatus,
  to: OrderStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid status transition: ${from} -> ${to}. ` +
      `Valid transitions from ${from}: ${VALID_TRANSITIONS[from]?.join(", ") || "none"}`
    );
  }
}

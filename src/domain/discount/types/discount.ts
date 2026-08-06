export type DiscountRuleType = "ITEM" | "CART";
export type DiscountValueKind = "PERCENTAGE" | "ABSOLUTE";

/**
 * Serializable projection of a DiscountCode row: Decimals become numbers and
 * dates become ISO strings, so the same shape crosses the RSC/client boundary
 * and feeds the pure business logic on both sides.
 */
export type DiscountRule = {
  id: string;
  code: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  type: DiscountRuleType;
  valueType: DiscountValueKind;
  /** € for ABSOLUTE, 0-100 for PERCENTAGE. */
  value: number;
  /** ITEM type only: Prismic product uids the discount applies to. */
  targetProductUids: string[];
  /** Qualifier: cart must contain at least one of these product uids. */
  containsItemUids: string[];
  /** Qualifier: minimum subtotal + shipping in €. */
  minOrderAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  usedCount: number;
};

/** Serializable create/update payload for admin CRUD (dates as ISO strings). */
export type DiscountCodeUpsertInput = {
  code: string;
  description?: string | null;
  type: DiscountRuleType;
  valueType: DiscountValueKind;
  /** € for ABSOLUTE, 0-100 for PERCENTAGE. */
  value: number;
  targetProductUids?: string[];
  containsItemUids?: string[];
  minOrderAmount?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  maxUses?: number | null;
  status?: "ACTIVE" | "INACTIVE";
};

/** The slice of a cart line the discount logic needs. */
export type DiscountCartItem = {
  uid: string;
  /** Unit price in €. */
  price: number;
  quantity: number;
};

export type DiscountCartContext = {
  items: DiscountCartItem[];
  /** Item subtotal in €. */
  subTotal: number;
  /** Shipping cost in €. */
  shippingCost: number;
};

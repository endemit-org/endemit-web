import { CountryCode } from "@/domain/checkout/types/country";
import Stripe from "stripe";

import { CartItem } from "@/domain/checkout/types/cartItem";
import { DiscountRule } from "@/domain/discount/types/discount";

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum OrderPaymentMethod {
  ONLINE = "ONLINE",
  IN_STORE = "IN_STORE",
}

export enum OrderPaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export type ComplementaryTicketField = Record<string, string>;

export enum DeliveryMethod {
  SHIPPING = "SHIPPING",
  PICKUP = "PICKUP",
}

/** Sentinel for the "po dogovoru" pickup option (no specific event). */
export const PICKUP_BY_AGREEMENT = "by-agreement";

/** Upcoming event the customer can collect a pickup order at. */
export type PickupEvent = {
  uid: string;
  name: string;
  dateStart: string; // ISO, serialisable for the client
  venueName: string | null;
};

/** Resolved pickup choice stored on the order. */
export type PickupSelection = {
  eventUid: string | null;
  eventName: string | null;
  eventDate: Date | null;
};

export type ShippingAddress = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: CountryCode;
  phone: string;
};

/**
 * An applied discount code as seen by the checkout: the full rule (so the
 * client can re-evaluate/re-qualify it when the cart changes) plus the
 * legacy promoCodeKey/promoCodeId aliases the checkout UI already uses.
 */
export type DiscountDetails = DiscountRule & {
  success: boolean;
  /** Alias of `code`. */
  promoCodeKey: string;
  /** Alias of `id`. */
  promoCodeId: string;
};

export interface CheckoutFormData extends ShippingAddress {
  email: string;
  /** Only meaningful when the cart has shippable items. */
  deliveryMethod: DeliveryMethod;
  /** Event uid, PICKUP_BY_AGREEMENT, or "" when nothing chosen yet. */
  pickupEventUid: string;
  emailRepeat: string;
  termsAndConditions: boolean;
  subscribeToNewsletter?: boolean;
  discountCodeId?: string;

  complementaryTicketData: ComplementaryTicketField;
}

export type CustomProductMetadata = {
  productType: string;
  productCategory: string;
  relatedEvent: string | null;
  ticketHolders: string | null;
  ticketQuantity: string | null;
  uid: string;
};

export type CheckoutSessionMetaData = Record<string, string>;

export type CustomStripeLineItem =
  Stripe.Checkout.SessionCreateParams.LineItem & {
    price_data?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData & {
      product_data?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData & {
        metadata?: CustomProductMetadata;
      };
    };
  };

export type CheckoutSessionRequestBody = {
  items: CartItem[];
  email: string;
  formData: CheckoutFormData;
  termsAndConditions: boolean;
  shippingAddress?: ShippingAddress;
  complementaryTicketData: ComplementaryTicketField;
  subscribeToNewsletter: boolean;
  discountCodeId?: string;
  walletCreditAmount?: number; // Amount in cents to use from wallet
};

import { CountryCode } from "@/domain/checkout/types/country";
import Stripe from "stripe";

import { CartItem } from "@/domain/checkout/types/cartItem";

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

export type ShippingAddress = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: CountryCode;
  phone: string;
};

export type DiscountDetails = {
  success: boolean;
  promoCodeKey: string;
  promoCodeId: string;
  coupon: {
    id: string;
    percent_off?: number;
    amount_off?: number;
  };
  restrictions?: Stripe.PromotionCode.Restrictions;
};

export interface CheckoutFormData extends ShippingAddress {
  email: string;
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
};

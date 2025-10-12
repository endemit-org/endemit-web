import { CartItem } from "@/types/cart";
import { Country } from "@/types/country";
import Stripe from "stripe";

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

export type ShippingAddress = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: Country;
  phone: string;
};

export interface CheckoutFormData extends ShippingAddress {
  email: string;
  emailRepeat: string;
  termsAndConditions: boolean;

  complementaryTicketData: Record<string, string | boolean> | null;
}

type CustomProductMetadata = {
  productType: string;
  productCategory: string;
  relatedEvent: string | null;
  ticketHolders: string | null;
  uid: string;
};

export type CustomStripeLineItem =
  Stripe.Checkout.SessionCreateParams.LineItem & {
    price_data?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData & {
      product_data?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData & {
        metadata?: CustomProductMetadata;
      };
    };
  };

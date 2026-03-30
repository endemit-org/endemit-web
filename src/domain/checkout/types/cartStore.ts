import { Product } from "@/domain/product/types/product";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/domain/checkout/types/cartItem";

export interface CheckoutOptions {
  formData: CheckoutFormData;
  walletCreditAmount?: number; // Amount in cents to use from wallet
  promoCode?: string;
  paymentIntentId?: string; // Existing PaymentIntent to update
}

export interface InitPaymentOptions {
  country?: string;
  promoCode?: string;
  walletCreditAmount?: number;
}

export interface InitPaymentResult {
  clientSecret?: string;
  paymentIntentId?: string;
  amount: number;
  fullWalletPayment: boolean;
}

export interface PaymentIntentResult {
  clientSecret?: string;
  paymentIntentId?: string;
  orderId: string;
  fullWalletPayment: boolean;
}

export interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  clearItem: (productId: string) => void;
  clearCart: () => void;

  // Computed values
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemById: (productId: string) => CartItem | undefined;

  // Bulk operations
  populateProducts: (products: Product[]) => void;

  // Checkout process (legacy - Stripe hosted checkout)
  checkout: (options: CheckoutOptions) => Promise<{
    sessionId: string;
    url: string;
  }>;

  // Payment Intent flow (inline payment)
  initPayment: (options: InitPaymentOptions) => Promise<InitPaymentResult>;
  createPaymentIntent: (options: CheckoutOptions) => Promise<PaymentIntentResult>;
}

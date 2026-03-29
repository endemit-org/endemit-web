import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartStore, PaymentIntentResult, InitPaymentResult } from "@/domain/checkout/types/cartStore";
import { Product } from "@/domain/product/types/product";
import { getApiPath } from "@/lib/util/api";
import { canProductExistInCart } from "@/domain/product/businessLogic";
import { CartItem } from "@/domain/checkout/types/cartItem";

interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface InitPaymentResponse {
  clientSecret?: string;
  paymentIntentId?: string;
  amount: number;
  fullWalletPayment?: boolean;
}

interface CreatePaymentIntentResponse {
  clientSecret?: string;
  paymentIntentId?: string;
  orderId: string;
  fullWalletPayment?: boolean;
}

interface CheckoutError {
  error: string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (product: Product, quantity = 1) => {
        if (!canProductExistInCart(product)) {
          return;
        }

        set(state => {
          const existingItem = state.items.find(item => item.id === product.id);

          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { ...product, quantity }],
          };
        });
      },

      removeItem: (productId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set(state => ({
          items: state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      incrementItem: (productId: string) => {
        const item = get().getItemById(productId);
        if (item) {
          get().updateQuantity(productId, item.quantity + 1);
        }
      },

      decrementItem: (productId: string) => {
        const item = get().getItemById(productId);
        if (item && item.quantity > 1) {
          get().updateQuantity(productId, item.quantity - 1);
        }
      },

      clearItem: (productId: string) => {
        get().removeItem(productId);
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemById: (productId: string) => {
        return get().items.find(item => item.id === productId);
      },

      populateProducts: (products: Product[]) => {
        set(state => {
          const newItems: CartItem[] = products.map(product => {
            const existingItem = state.items.find(
              item => item.id === product.id
            );
            return existingItem || { ...product, quantity: 1 };
          });

          return { items: newItems };
        });
      },

      initPayment: async options => {
        const items = get().items;

        if (items.length === 0) {
          throw new Error("Cart is empty");
        }

        set({ isLoading: true });

        try {
          const response = await fetch(getApiPath("checkout/init-payment"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items,
              country: options.country,
              promoCode: options.promoCode,
              walletCreditAmount: options.walletCreditAmount,
            }),
          });

          if (!response.ok) {
            const errorData: CheckoutError = await response.json();
            throw new Error(errorData.error || "Failed to initialize payment");
          }

          const data: InitPaymentResponse = await response.json();

          const result: InitPaymentResult = {
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId,
            amount: data.amount,
            fullWalletPayment: data.fullWalletPayment ?? false,
          };

          return result;
        } catch (error) {
          console.error("Init payment error:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      checkout: async options => {
        const items = get().items;

        if (items.length === 0) {
          throw new Error("Cart is empty");
        }

        set({ isLoading: true });

        try {
          const { formData, walletCreditAmount } = options;
          const {
            email,
            emailRepeat,
            complementaryTicketData,
            termsAndConditions,
            subscribeToNewsletter,
            discountCodeId,
            ...shippingAddress
          } = formData;
          const response = await fetch(getApiPath("checkout/create-session"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items,
              email,
              emailRepeat,
              complementaryTicketData,
              termsAndConditions,
              shippingAddress,
              subscribeToNewsletter,
              discountCodeId,
              formData,
              walletCreditAmount,
            }),
          });

          if (!response.ok) {
            const errorData: CheckoutError = await response.json();
            throw new Error(
              errorData.error || "Failed to create checkout session"
            );
          }

          const data: CreateCheckoutSessionResponse = await response.json();

          // Redirect to Stripe checkout
          if (data.url) {
            window.location.href = data.url;
          }

          return data;
        } catch (error) {
          console.error("Checkout error:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      createPaymentIntent: async options => {
        const items = get().items;

        if (items.length === 0) {
          throw new Error("Cart is empty");
        }

        set({ isLoading: true });

        try {
          const { formData, walletCreditAmount, promoCode, paymentIntentId } = options;
          const {
            email,
            emailRepeat,
            complementaryTicketData,
            termsAndConditions,
            subscribeToNewsletter,
            ...shippingAddress
          } = formData;

          const response = await fetch(
            getApiPath("checkout/create-payment-intent"),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items,
                email,
                emailRepeat,
                complementaryTicketData,
                termsAndConditions,
                shippingAddress,
                subscribeToNewsletter,
                formData,
                walletCreditAmount,
                promoCode,
                paymentIntentId,
              }),
            }
          );

          if (!response.ok) {
            const errorData: CheckoutError = await response.json();
            throw new Error(
              errorData.error || "Failed to create payment intent"
            );
          }

          const data: CreatePaymentIntentResponse = await response.json();

          const result: PaymentIntentResult = {
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId,
            orderId: data.orderId,
            fullWalletPayment: data.fullWalletPayment ?? false,
          };

          return result;
        } catch (error) {
          console.error("Payment intent error:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ items: state.items }),
    }
  )
);

// Custom hooks for easier usage
export const useCart = () => {
  const store = useCartStore();
  return {
    items: store.items,
    isLoading: store.isLoading,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    incrementItem: store.incrementItem,
    decrementItem: store.decrementItem,
    clearItem: store.clearItem,
    clearCart: store.clearCart,
    totalItems: store.getTotalItems(),
    subtotalPrice: store.getTotalPrice(),
    getItemById: store.getItemById,
    populateProducts: store.populateProducts,
    checkout: store.checkout,
  };
};

// Selector hooks for performance optimization
export const useCartItems = () => useCartStore(state => state.items);
export const useCartTotal = () => useCartStore(state => state.getTotalPrice());
export const useCartItemCount = () =>
  useCartStore(state => state.getTotalItems());
export const useCartLoading = () => useCartStore(state => state.isLoading);

// Actions selector - use callback to avoid re-renders
export const useCartActions = () => {
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const incrementItem = useCartStore(state => state.incrementItem);
  const decrementItem = useCartStore(state => state.decrementItem);
  const clearItem = useCartStore(state => state.clearItem);
  const clearCart = useCartStore(state => state.clearCart);
  const populateProducts = useCartStore(state => state.populateProducts);
  const checkout = useCartStore(state => state.checkout);
  const initPayment = useCartStore(state => state.initPayment);
  const createPaymentIntent = useCartStore(state => state.createPaymentIntent);

  return {
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearItem,
    clearCart,
    populateProducts,
    checkout,
    initPayment,
    createPaymentIntent,
  };
};

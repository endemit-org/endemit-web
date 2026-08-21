"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { PosItemGrid } from "./PosItemGrid";
import { PosCart } from "./PosCart";
import { PosOrderQueue } from "./PosOrderQueue";
import { PosOrderQrModal } from "./PosOrderQrModal";
import { PosRecentTransactions } from "./PosRecentTransactions";
import { PosRegisterStatsModal } from "./PosRegisterStatsModal";

// Dynamic import: QR Scanner (~120KB) only loads when balance check is opened
const PosBalanceCheckModal = dynamic(
  () =>
    import("./PosBalanceCheckModal").then(mod => ({
      default: mod.PosBalanceCheckModal,
    })),
  { ssr: false }
);

interface PosItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  direction: "CREDIT" | "DEBIT";
  color: string | null;
}

interface PosOrderSummary {
  id: string;
  shortCode: string;
  orderHash: string;
  subtotal: number;
  total: number;
  status: string;
  scannedAt: string | null;
  expiresAt: string;
  createdAt: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    total: number;
    direction?: "CREDIT" | "DEBIT";
  }>;
  customerName?: string;
  customerFirstName?: string | null;
  customerImage?: string | null;
  customerBalance?: number;
  hasEnoughBalance?: boolean;
  tipAmount?: number;
  paymentMethod?: "WALLET" | "CASH" | "CARD";
  paidAt?: string;
}

interface CartItem {
  item: PosItem;
  quantity: number;
}

interface Props {
  register: {
    id: string;
    name: string;
    canTopUp: boolean;
    acceptsWallet: boolean;
    acceptsCash: boolean;
    acceptsCard: boolean;
  };
  items: PosItem[];
  initialPendingOrders: PosOrderSummary[];
  showBackButton?: boolean;
}

export function PosRegisterInterface({
  register,
  items,
  initialPendingOrders,
  showBackButton = true,
}: Props) {
  const t = useTranslations("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrders, setPendingOrders] =
    useState<PosOrderSummary[]>(initialPendingOrders);
  const [activeOrder, setActiveOrder] = useState<PosOrderSummary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBalanceCheckOpen, setIsBalanceCheckOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  // Sort and filter items
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sortedItems;
    const query = searchQuery.toLowerCase();
    return sortedItems.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  }, [sortedItems, searchQuery]);

  // Real-time updates for this register
  useRealtimeChannel({
    channelName: `pos:register:${register.id}`,
    event: "pos_order_scanned",
    onMessage: payload => {
      setPendingOrders(prev =>
        prev.map(o =>
          o.id === payload.orderId
            ? {
                ...o,
                scannedAt: new Date().toISOString(),
                customerName: payload.customerName,
                customerFirstName: payload.customerFirstName,
                customerImage: payload.customerImage,
                customerBalance: payload.balance,
                hasEnoughBalance: payload.hasEnoughBalance,
              }
            : o
        )
      );
      if (activeOrder?.id === payload.orderId) {
        setActiveOrder(prev =>
          prev
            ? {
                ...prev,
                scannedAt: new Date().toISOString(),
                customerName: payload.customerName,
                customerFirstName: payload.customerFirstName,
                customerImage: payload.customerImage,
                customerBalance: payload.balance,
                hasEnoughBalance: payload.hasEnoughBalance,
              }
            : null
        );
      }
    },
  });

  useRealtimeChannel({
    channelName: `pos:register:${register.id}`,
    event: "pos_order_paid",
    onMessage: payload => {
      setPendingOrders(prev => prev.filter(o => o.id !== payload.orderId));
      setTxRefreshKey(k => k + 1);
      if (activeOrder?.id === payload.orderId) {
        setActiveOrder(prev =>
          prev
            ? {
                ...prev,
                status: "PAID",
                tipAmount: payload.tipAmount,
                paymentMethod: payload.paymentMethod,
                paidAt: payload.paidAt,
                customerBalance: payload.balanceAfter,
              }
            : null
        );
      }
    },
  });

  useRealtimeChannel({
    channelName: `pos:register:${register.id}`,
    event: "pos_order_cancelled",
    onMessage: payload => {
      setPendingOrders(prev => prev.filter(o => o.id !== payload.orderId));
      setTxRefreshKey(k => k + 1);
      if (activeOrder?.id === payload.orderId) {
        setActiveOrder(null);
      }
    },
  });

  const addToCart = useCallback((item: PosItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(c => c.item.id !== itemId));
    } else {
      setCart(prev =>
        prev.map(c => (c.item.id === itemId ? { ...c, quantity } : c))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const createOrder = useCallback(async () => {
    if (cart.length === 0 || isCreating) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/v1/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerId: register.id,
          items: cart.map(c => ({ itemId: c.item.id, quantity: c.quantity })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const newOrder: PosOrderSummary = {
        id: data.order.id,
        shortCode: data.order.shortCode,
        orderHash: data.order.orderHash,
        subtotal: data.order.subtotal,
        total: data.order.total,
        status: data.order.status,
        scannedAt: null,
        expiresAt: data.order.expiresAt,
        createdAt: new Date().toISOString(),
        items: data.order.items.map((i: { itemId: string; name: string; quantity: number; total: number }) => ({
          itemId: i.itemId,
          name: i.name,
          quantity: i.quantity,
          total: i.total,
          // API response has no direction — the cart does
          direction: cart.find(c => c.item.id === i.itemId)?.item.direction,
        })),
      };

      setPendingOrders(prev => [newOrder, ...prev]);
      setTxRefreshKey(k => k + 1);
      setActiveOrder(newOrder);
      clearCart();
    } catch (error) {
      console.error("Failed to create order:", error);
      alert(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setIsCreating(false);
    }
  }, [cart, register.id, isCreating, clearCart]);

  const cancelOrder = useCallback(async (orderHash: string) => {
    try {
      const response = await fetch(`/api/v1/pos/orders/${orderHash}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel order");
      }

      setPendingOrders(prev => prev.filter(o => o.orderHash !== orderHash));
      if (activeOrder?.orderHash === orderHash) {
        setActiveOrder(null);
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel order");
    }
  }, [activeOrder]);

  const copyToCart = useCallback(
    async (order: PosOrderSummary) => {
      // Cancel the order first
      try {
        await fetch(`/api/v1/pos/orders/${order.orderHash}/cancel`, {
          method: "POST",
        });
        setPendingOrders(prev => prev.filter(o => o.orderHash !== order.orderHash));
      } catch (error) {
        console.error("Failed to cancel order:", error);
      }

      // Copy items to cart
      const newCartItems: CartItem[] = [];
      for (const orderItem of order.items) {
        const item = sortedItems.find(i => i.id === orderItem.itemId);
        if (item) {
          newCartItems.push({ item, quantity: orderItem.quantity });
        }
      }
      setCart(newCartItems);
      setActiveOrder(null);
    },
    [sortedItems]
  );

  const cartTotal = cart.reduce(
    (sum, c) => sum + c.item.cost * c.quantity,
    0
  );

  // Determine cart direction - if cart has items, disable the opposite type
  const cartDirection = useMemo(() => {
    if (cart.length === 0) return null;
    // Get direction of first item in cart
    return cart[0].item.direction;
  }, [cart]);

  // Disable the opposite direction
  const disabledDirection = cartDirection === "CREDIT" ? "DEBIT" : cartDirection === "DEBIT" ? "CREDIT" : null;

  return (
    <div className="flex h-[calc(100dvh-4rem)] relative">
      {/* Main: Items + Cart */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-2 p-3 border-b bg-white">
          {showBackButton && (
            <Link
              href="/pos"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          )}
          <span className="font-medium text-gray-900 flex-1">{register.name}</span>

          <button
            onClick={() => setIsBalanceCheckOpen(true)}
            className="flex items-center gap-1 px-2 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2m10-18h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M7 12h10" />
            </svg>
            <span className="text-xs font-medium">{t("balanceCheck.label")}</span>
          </button>

          {/* Desktop Search */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("register.searchPlaceholder")}
                  autoFocus
                  className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* Mobile Header with back button and sidebar toggle */}
        <div className="flex items-center justify-between p-3 border-b bg-white lg:hidden">
          {isSearchOpen ? (
            /* Mobile Search Mode */
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("register.searchPlaceholder")}
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            /* Normal Mobile Header */
            <>
              <div className="flex items-center gap-2">
                {showBackButton && (
                  <Link
                    href="/pos"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </Link>
                )}
                <span className="font-medium text-gray-900">{register.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsBalanceCheckOpen(true)}
                  className="flex items-center gap-1 px-2 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2m10-18h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M7 12h10" />
                  </svg>
                  <span className="text-xs font-medium">{t("balanceCheck.label")}</span>
                </button>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {pendingOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingOrders.length}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto p-4">
          <PosItemGrid
            items={filteredItems}
            onAddItem={addToCart}
            disabledDirection={disabledDirection}
          />
        </div>

        {/* Cart */}
        <div className="border-t bg-white">
          <PosCart
            items={cart}
            total={cartTotal}
            onUpdateQuantity={updateQuantity}
            onClear={clearCart}
            onCreateOrder={createOrder}
            isCreating={isCreating}
          />
        </div>
      </div>

      {/* Desktop Sidebar: pending orders on top, recent transactions below */}
      <div className="hidden lg:flex flex-col w-80 border-l bg-white">
        <button
          onClick={() => setIsStatsOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 border-b text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t("stats.label")}
        </button>
        <div className="flex-1 min-h-0 overflow-auto">
          <PosOrderQueue
            orders={pendingOrders}
            onSelectOrder={setActiveOrder}
            onCancelOrder={cancelOrder}
            selectedOrderId={activeOrder?.id}
          />
        </div>
        <div className="h-1/2 border-t">
          <PosRecentTransactions
            registerId={register.id}
            refreshKey={txRefreshKey}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-medium">{t("orders.pendingOrders")}</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 border-b text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t("stats.label")}
            </button>
            <div className="h-1/2 overflow-auto">
              <PosOrderQueue
                orders={pendingOrders}
                onSelectOrder={order => {
                  setActiveOrder(order);
                  setIsSidebarOpen(false);
                }}
                onCancelOrder={cancelOrder}
                selectedOrderId={activeOrder?.id}
              />
            </div>
            <div className="flex-1 min-h-0 border-t">
              <PosRecentTransactions
                registerId={register.id}
                refreshKey={txRefreshKey}
              />
            </div>
          </div>
        </div>
      )}

      {/* Balance Check Modal */}
      {isBalanceCheckOpen && (
        <PosBalanceCheckModal onClose={() => setIsBalanceCheckOpen(false)} />
      )}

      {/* Register Stats Modal */}
      {isStatsOpen && (
        <PosRegisterStatsModal
          registerId={register.id}
          registerName={register.name}
          onClose={() => setIsStatsOpen(false)}
        />
      )}


      {/* QR Modal */}
      {activeOrder && (
        <PosOrderQrModal
          order={activeOrder}
          register={register}
          onClose={() => setActiveOrder(null)}
          onCopyToCart={() => copyToCart(activeOrder)}
        />
      )}
    </div>
  );
}

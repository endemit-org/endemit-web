"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { Product, ProductCategory } from "@/domain/product/types/product";
import { isProductSellable } from "@/domain/product/businessLogic";
import { useCartActions } from "@/app/_stores/CartStore";
import { formatTokens } from "@/lib/util/currency";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import ModalPortal from "@/app/_components/ui/ModalPortal";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  balance?: number | null;
}

const panelSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

export default function TopUpModal({
  isOpen,
  onClose,
  products,
  balance = null,
}: TopUpModalProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const { addItem, clearCart } = useCartActions();
  const [isLoading, setIsLoading] = useState(false);

  // Filter to only sellable currency products
  const currencyProducts = useMemo(
    () =>
      products
        .filter(p => p.category === ProductCategory.CURRENCIES)
        .filter(p => isProductSellable(p).isSellable)
        .sort((a, b) => a.price - b.price),
    [products]
  );

  // Preselect the second item (index 1) if available, otherwise first
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    () => currencyProducts[1] ?? currencyProducts[0] ?? null
  );

  const handleClose = () => {
    if (isLoading) return;
    // Reset to preselected item (second item or first)
    setSelectedProduct(currencyProducts[1] ?? currencyProducts[0] ?? null);
    onClose();
  };

  // Lock page scroll while the modal is up.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoading]);

  const handleTopUp = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);

    // Store return URL for after checkout success
    localStorage.setItem("checkoutReturnUrl", "/profile");

    // Clear cart and add the selected top-up product
    clearCart();
    addItem(selectedProduct, 1);

    // Navigate to checkout
    router.push("/store/checkout");
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={handleClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.94, y: 24 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0, transition: { duration: 0.15 } }
                  : {
                      opacity: 0,
                      scale: 0.96,
                      y: 12,
                      transition: { duration: 0.16, ease: "easeIn" },
                    }
              }
              transition={panelSpring}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 pb-6 pt-6">
                <p className="text-white text-lg font-semibold text-center mb-1">
                  {t("sidebar.topUpWallet")}
                </p>

                {currencyProducts.length === 0 ? (
                  <p className="text-neutral-400 text-sm text-center py-6">
                    {t("topUp.noOptions")}
                  </p>
                ) : (
                  <>
                    <p className="text-neutral-400 text-sm text-center mb-5">
                      {t("topUp.selectAmountDesc")}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {currencyProducts.map((product, index) => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          disabled={isLoading}
                          className={clsx(
                            "relative p-3.5 rounded-xl border text-center transition-colors active:scale-[0.98]",
                            selectedProduct?.id === product.id
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-neutral-800 bg-neutral-800/40 hover:border-neutral-600"
                          )}
                        >
                          {index === 1 && (
                            <Image
                              src="/images/transparent.gif"
                              alt={t("topUp.hot")}
                              width={24}
                              height={24}
                              className="absolute -top-2 -right-2 w-6 h-6"
                              unoptimized
                            />
                          )}
                          <span className="text-2xl font-semibold text-white tabular-nums">
                            {formatTokens(product.price, 0)}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Projected balance: current + selected amount. The
                      spring in AnimatedBalance counts it up/down as the
                      selection changes. Product prices are whole tokens,
                      wallet balance is cents. */}
                    {balance !== null && (
                      <div className="text-center mb-5">
                        <div className="text-xs text-blue-300 mb-1">
                          {t("topUp.newBalance")}
                        </div>
                        <AnimatedBalance
                          // The modal's content unmounts on close, so every
                          // open counts up from the current balance afresh.
                          initialValue={balance}
                          value={balance + (selectedProduct?.price ?? 0) * 100}
                          className={clsx(
                            "text-3xl font-bold tabular-nums",
                            balance + (selectedProduct?.price ?? 0) * 100 > 0
                              ? "text-green-400"
                              : balance + (selectedProduct?.price ?? 0) * 100 <
                                  0
                                ? "text-red-400"
                                : "text-neutral-300"
                          )}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleTopUp}
                      disabled={!selectedProduct || isLoading}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden
                            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                          />
                          {t("topUp.redirecting")}
                        </span>
                      ) : selectedProduct ? (
                        t("topUp.addToWallet", {
                          amount: formatTokens(selectedProduct.price, 0),
                        })
                      ) : (
                        t("topUp.selectAmount")
                      )}
                    </button>

                    <p className="text-xs text-neutral-500 text-center mt-3">
                      {t("topUp.cashNotice")}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

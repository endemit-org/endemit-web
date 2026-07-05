"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import clsx from "clsx";
import ToteBagIcon from "@/app/_components/icon/TotebagIcon";
import { useCartItemCount, useCartTotal } from "@/app/_stores/CartStore";
import { formatPrice } from "@/lib/util/formatting";
import ActionButton from "@/app/_components/form/ActionButton";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Props {
  variant?: "compact" | "detailed";
  /** Called when the user navigates to checkout (e.g. to close the mobile menu). */
  onNavigate?: () => void;
}

export default function Cart({ variant = "detailed", onNavigate }: Props) {
  const t = useTranslations("cart");
  const itemCount = useCartItemCount();
  const totalPrice = useCartTotal();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [shouldBounce, setShouldBounce] = useState(false);
  const [prevTotal, setPrevTotal] = useState(totalPrice);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (
      totalPrice !== prevTotal &&
      totalPrice !== undefined &&
      prevTotal !== undefined
    ) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 200);
      return () => clearTimeout(timer);
    }
    setPrevTotal(totalPrice);
  }, [totalPrice, prevTotal]);

  const handleGoToCart = () => {
    onNavigate?.();
    router.push("/store/checkout");
  };

  const displayItemCount = isClient ? itemCount || 0 : 0;
  const displayTotalPrice = isClient ? (totalPrice ?? 0) : 0;
  const isEmpty = displayItemCount === 0;

  return (
    <div
      className={clsx(
        variant === "detailed" &&
          "border-t-2 border-t-neutral-800 pt-4 flex flex-col items-end px-3 leading-none"
      )}
    >
      <Link
        className="flex items-center space-x-3 h-14 text-md group"
        href="/store/checkout"
        onClick={onNavigate}
      >
        <div
          className={clsx(
            "text-2xl group-hover:text-gray-400 font-heading",
            !isEmpty && isClient
              ? "text-blue-400"
              : "text-gray-400 max-md:hidden"
          )}
        >
          {formatPrice(displayTotalPrice)}
        </div>
        <div className="text-sm">
          <span className="text-gray-100 group-hover:text-gray-400 group-hover:scale-105 transition duration-200 inline-block">
            {displayItemCount > 0 && (
              <div className="bg-blue-400 w-4 lg:w-6 h-3.5 lg:h-4 absolute mt-3 lg:mt-5 -z-10 animate-pulse"></div>
            )}
            <ToteBagIcon className={"w-4 lg:w-6"} />
            <div
              className={clsx(
                "absolute rounded-full text-gray-100 px-1 ml-3 -mt-3 inline-block pt-0.5 font-heading",
                !isEmpty && isClient ? "bg-blue-500" : "bg-gray-800",
                shouldBounce ? "animate-ping" : ""
              )}
            >
              {displayItemCount}
            </div>
          </span>
        </div>
      </Link>
      {variant === "detailed" && displayItemCount > 0 && isClient && (
        <>
          <div className="items-center space-x-3 text-neutral-200 inline-flex">
            <div className="text-sm">
              {t("itemsInCart", { count: displayItemCount })}
            </div>
          </div>
          <div className="mt-3 animate-rave-125bmp-delay hover:[animation:none]">
            <ActionButton onClick={handleGoToCart} size={"sm"}>
              {t("checkout")}
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}

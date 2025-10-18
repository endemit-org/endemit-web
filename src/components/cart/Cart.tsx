"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import ToteBagIcon from "@/components/icon/TotebagIcon";
import { useCartItemCount, useCartTotal } from "@/stores/CartStore";
import { formatPrice } from "../../../lib/formatting";
import ActionButton from "@/components/form/ActionButton";
import { useRouter } from "next/navigation";

interface Props {
  variant?: "compact" | "detailed";
}

export default function Cart({ variant = "detailed" }: Props) {
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
      >
        <div
          className={clsx(
            "text-2xl group-hover:text-gray-400 font-heading",
            !isEmpty && isClient ? "text-blue-400" : "text-gray-400"
          )}
        >
          {formatPrice(displayTotalPrice)}
        </div>
        <div className="text-sm">
          <span className="text-gray-100 group-hover:text-gray-400 group-hover:scale-105 transition duration-200 inline-block">
            {displayItemCount > 0 && (
              <div className="bg-blue-400 w-5 lg:w-6 h-4 absolute mt-4 lg:mt-5 -z-10 animate-pulse"></div>
            )}
            <ToteBagIcon />
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
          <div className="items-center space-x-3 text-white inline-flex">
            <div className="text-sm">{displayItemCount} items in your cart</div>
          </div>
          <div className="mt-3 animate-rave-125bmp hover:[animation:none]">
            <ActionButton onClick={handleGoToCart} size={"sm"}>
              Checkout
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/_components/analytics/trackEvent";
import {
  TRACKING_CURRENCY,
  TrackedEvent,
} from "@/lib/services/tracking/events";

interface ViewContentEventProps {
  productUid: string;
  name: string;
  category: string;
  price: number;
}

/**
 * Reports a product detail view to every configured ad platform.
 *
 * ViewContent is the top of the purchase funnel and the signal used to build
 * product-interest audiences, so the product is passed as a single content
 * line — the same id shape AddToCart and Purchase use. Matching ids across
 * the three is what lets a catalogue campaign retarget a specific product.
 */
export default function ViewContentEvent({
  productUid,
  name,
  category,
  price,
}: ViewContentEventProps) {
  useEffect(() => {
    trackEvent(TrackedEvent.VIEW_CONTENT, {
      currency: TRACKING_CURRENCY,
      value: price,
      contentName: name,
      contentCategory: category,
      contents: [
        { id: productUid, quantity: 1, unitPrice: price, name, category },
      ],
    });
  }, [productUid, name, category, price]);

  return null;
}

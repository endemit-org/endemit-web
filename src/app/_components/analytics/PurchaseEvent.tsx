"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/app/_components/analytics/trackEvent";
import {
  countItems,
  purchaseEventId,
  TRACKING_CURRENCY,
  TrackedEvent,
  type TrackedContent,
} from "@/lib/services/tracking/events";

interface PurchaseEventProps {
  orderId: string;
  value: number;
  contents: TrackedContent[];
}

/**
 * Browser-side purchase conversion, fired once when the checkout success page
 * renders, to every configured ad platform.
 *
 * The same purchase is also reported server-side from the payment processing
 * job. Both carry `purchaseEventId(orderId)`, so each platform keeps
 * whichever arrives first and discards the duplicate — including on a page
 * refresh, which re-fires this event with the same id.
 */
export default function PurchaseEvent({
  orderId,
  value,
  contents,
}: PurchaseEventProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    trackEvent(
      TrackedEvent.PURCHASE,
      {
        currency: TRACKING_CURRENCY,
        value,
        contents,
        numItems: countItems(contents),
        orderId,
      },
      purchaseEventId(orderId)
    );
  }, [orderId, value, contents]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/app/_components/analytics/metaPixelClient";
import {
  META_CURRENCY,
  MetaEvent,
  metaPurchaseEventId,
  type MetaContent,
} from "@/lib/services/meta/events";

interface MetaPurchaseEventProps {
  orderId: string;
  value: number;
  contents: MetaContent[];
  numItems: number;
}

/**
 * Browser-side Purchase, fired once when the checkout success page renders.
 *
 * The same purchase is also reported server-side from the payment processing
 * job. Both carry `metaPurchaseEventId(orderId)`, so Meta keeps whichever
 * arrives first and discards the duplicate — including on a page refresh,
 * which re-fires this event with the same id.
 */
export default function MetaPurchaseEvent({
  orderId,
  value,
  contents,
  numItems,
}: MetaPurchaseEventProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    trackMetaEvent(
      MetaEvent.PURCHASE,
      {
        currency: META_CURRENCY,
        value,
        content_type: "product",
        content_ids: contents.map(content => content.id),
        contents,
        num_items: numItems,
        order_id: orderId,
      },
      metaPurchaseEventId(orderId)
    );
  }, [orderId, value, contents, numItems]);

  return null;
}

"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/app/_components/analytics/metaPixelClient";
import { META_CURRENCY, MetaEvent } from "@/lib/services/meta/events";

interface MetaViewContentEventProps {
  productUid: string;
  name: string;
  category: string;
  price: number;
}

/**
 * Reports a product detail view to the Meta Pixel.
 *
 * ViewContent is the top of the purchase funnel and the signal Meta uses to
 * build product-interest audiences, so it carries the same `content_ids` the
 * AddToCart and Purchase events use — matching ids across the three is what
 * lets a catalogue-based campaign retarget a specific product.
 */
export default function MetaViewContentEvent({
  productUid,
  name,
  category,
  price,
}: MetaViewContentEventProps) {
  useEffect(() => {
    trackMetaEvent(MetaEvent.VIEW_CONTENT, {
      currency: META_CURRENCY,
      value: price,
      content_type: "product",
      content_ids: [productUid],
      content_name: name,
      content_category: category,
    });
  }, [productUid, name, category, price]);

  return null;
}

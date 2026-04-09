import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformProductObject } from "@/domain/product/transformers/transformProductObject";
import { isFilled } from "@prismicio/client";
import { ProductDocument } from "@/prismicio-types";
import { FEAT_IGNORE_VISIBILITY } from "@/lib/services/env/private";

export const fetchTicketsForEventFromCms = async (eventId: string) => {
  const products = (await prismicClient.getAllByType("product", {
    pageSize: 200,
  })) as ProductDocument[];

  if (!products) {
    return null;
  }

  const ticketsForEvent = products.filter(product => {
    const eventDoc = isFilled.contentRelationship(product.data.related_to_event)
      ? product.data.related_to_event
      : null;

    if (!eventDoc) {
      return false;
    }

    const isVisible =
      FEAT_IGNORE_VISIBILITY || product.data.product_visibility === "Visible";

    return (
      product.data.price && product.data.price > 0 && eventDoc.id === eventId && isVisible
    );
  });

  if (!ticketsForEvent || ticketsForEvent.length === 0) {
    return null;
  }

  const transformedProducts = [];
  for (const product of ticketsForEvent) {
    transformedProducts.push(await transformProductObject(product));
  }
  return transformedProducts;
};

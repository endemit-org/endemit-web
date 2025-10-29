import {
  Product,
  ProductCompositionType,
} from "@/domain/product/types/product";

import { asLink, asText, isFilled } from "@prismicio/client";
import { ProductDocument } from "@/prismicio-types";

export const transformProductObject = (product: ProductDocument) => {
  const hasVariants =
    product.data.variants.filter(variant => variant.variant_value).length > 0;

  const hasRelatedProducts =
    product.data.related_products.filter(relatedProduct =>
      isFilled.contentRelationship(relatedProduct.related_product)
    ).length > 0;

  const relatedEvent = isFilled.contentRelationship(
    product.data.related_to_event
  )
    ? product.data.related_to_event
    : null;

  const hasRelatedEvent = !!relatedEvent;

  return {
    id: product.id,
    uid: product.uid,
    name: product.data.title,
    description: product.data.description,
    images: product.data.images.map(img => ({
      src: img.image.url,
      alt: img.image.alt,
    })),
    video: asLink(product.data.video) ?? null,
    price: product.data.price,
    currency: "eur",
    type: product.data.product_type,
    status: product.data.product_status,
    visibility: product.data.product_visibility,
    category: product.data.product_category,
    isFeatured: product.data.featured_product ?? false,
    sortingWeight: product.data.sorting_weight ?? 0,
    limits: {
      cutoffTimestamp: product.data.cutoff_date
        ? new Date(product.data.cutoff_date)
        : null,
      quantityLimit: product.data?.quantity_limit,
      regionalEligibility: product.data.regional_eligibility,
    },
    weight: product.data.weight,
    variants: product.data.variants,
    composition: hasVariants
      ? ProductCompositionType.CONFIGURABLE
      : ProductCompositionType.SINGLE,
    relatedProducts: hasRelatedProducts
      ? product.data.related_products.map(rp => {
          const relatedProduct = isFilled.contentRelationship(
            rp.related_product
          )
            ? rp.related_product
            : null;

          if (!relatedProduct || !relatedProduct.data) return null;

          return {
            id: relatedProduct.id,
            uid: relatedProduct.uid,
            title: relatedProduct.data.title,
            description: relatedProduct.data.description
              ? asText(relatedProduct.data.description)
              : null,
            category: relatedProduct.data.product_category,
            productType: relatedProduct.data.product_type,
            status: relatedProduct.data.product_status,
            visibility: relatedProduct.data.product_visibility,
            images: relatedProduct.data.images.map(img => ({
              src: img.image.url,
              alt: img.image.alt,
            })),
            price: relatedProduct.data.price,
            sortingWeight: relatedProduct.data.sorting_weight ?? 0,
            callToAction: rp.call_to_action,
          };
        })
      : null,
    relatedEvent:
      hasRelatedEvent && relatedEvent && relatedEvent.data
        ? {
            id: relatedEvent.id,
            uid: relatedEvent.uid,
            title: relatedEvent.data.title,
            venueName: relatedEvent.data.venue_name,
            venueAddress: relatedEvent.data.venue_address,
            venueLogo: asLink(relatedEvent.data?.venue_logo),
            date: relatedEvent.data.date_start,
          }
        : null,
    specialNotice: product.data.special_notice,
    checkoutDescription: product.data.checkout_description,
    slices: product.data.slices,
    displaySlicePosition: product.data.display_content_slices,
    updatedAt: new Date(product.last_publication_date),
    meta: {
      title: product.data.meta_title,
      description: product.data.meta_description,
      image: product.data.meta_image?.url || null,
    },
  } as Product;
};

import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

import { prismic } from "@/lib/services/prismic";
import ProductSection from "@/app/_components/product/ProductSection";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `ProductList`.
 */
export type ProductListProps = SliceComponentProps<
  Content.ProductListSlice,
  SliceContext
>;

/**
 * Component for "ProductList" Slices.
 */
const ProductList: FC<ProductListProps> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  let products = null;
  let gridSizeType: "small" | "large" = "small";
  // Type will be available after running Slice Machine to regenerate types
  const quickAddToCart =
    (slice.primary as { quick_add_to_cart?: boolean }).quick_add_to_cart ??
    false;

  if (slice.variation === "default" && slice.primary.category) {
    products = await fetchProductsFromCms({
      filters: [
        prismic.filter.at(
          "my.product.product_category",
          slice.primary.category
        ),
      ],
      locale,
    });
  }

  if (slice.variation === "featured") {
    products = await fetchProductsFromCms({
      filters: [prismic.filter.at("my.product.featured_product", true)],
      locale,
    });
  }

  if (slice.variation === "manual" && slice.primary.products) {
    const productIds = slice.primary.products.map(
      //@ts-expect-error product does have an id
      product => product.product.id
    );
    products = await fetchProductsFromCms({ locale });
    products = products
      ? products.filter(product => productIds.includes(product.id))
      : [];
    gridSizeType = slice.primary.grid_size_type ?? "small";
  }

  if (!products) {
    return;
  }

  const visibleProducts = products.filter(isProductVisible);

  const sortedProductsBySortingWeight = visibleProducts.sort(
    (a, b) => b.sortingWeight - a.sortingWeight
  );

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {sortedProductsBySortingWeight.length > 0 && (
        <ProductSection
          products={sortedProductsBySortingWeight}
          title={pickLocalized(slice.primary, "title", locale) ?? undefined}
          description={
            pickLocalized(slice.primary, "description", locale) ?? undefined
          }
          renderFrame={slice.primary.render_frame ?? false}
          gridType={gridSizeType}
          quickAddToCart={quickAddToCart}
        />
      )}
    </section>
  );
};

export default ProductList;

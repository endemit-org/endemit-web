import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

import { prismic } from "@/lib/services/prismic";
import ProductSection from "@/app/_components/product/ProductSection";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";

/**
 * Props for `ProductList`.
 */
export type ProductListProps = SliceComponentProps<Content.ProductListSlice>;

/**
 * Component for "ProductList" Slices.
 */
const ProductList: FC<ProductListProps> = async ({ slice }) => {
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
    });
  }

  if (slice.variation === "featured") {
    products = await fetchProductsFromCms({
      filters: [prismic.filter.at("my.product.featured_product", true)],
    });
  }

  if (slice.variation === "manual" && slice.primary.products) {
    const productIds = slice.primary.products.map(
      //@ts-expect-error product does have an id
      product => product.product.id
    );
    products = await fetchProductsFromCms({});
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
          title={slice.primary.title ?? undefined}
          description={slice.primary.description ?? undefined}
          renderFrame={slice.primary.render_frame ?? false}
          gridType={gridSizeType}
          quickAddToCart={quickAddToCart}
        />
      )}
    </section>
  );
};

export default ProductList;

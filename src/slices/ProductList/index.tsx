import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchProductsFromCms } from "@/domain/cms/actions";
import { prismic } from "@/app/services/prismic";
import ProductSection from "@/components/product/ProductSection";

/**
 * Props for `ProductList`.
 */
export type ProductListProps = SliceComponentProps<Content.ProductListSlice>;

/**
 * Component for "ProductList" Slices.
 */
const ProductList: FC<ProductListProps> = async ({ slice }) => {
  let products = null;

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
    products = products.filter(product => productIds.includes(product.id));
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {products && products.length > 0 && (
        <ProductSection
          products={products}
          title={slice.primary.title ?? undefined}
          description={slice.primary.description ?? undefined}
          renderFrame={slice.primary.render_frame ?? false}
        />
      )}
    </section>
  );
};

export default ProductList;

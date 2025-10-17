import { formatDecimalPrice } from "@/lib/formatting";
import { createSlug, getStatusText } from "@/lib/util";
import ProductStatusTag from "@/components/product/ProductStatusTag";
import ImageGallery from "@/components/ImageGallery";
import ProductConfigure from "@/components/product/ProductConfigure";
import {
  fetchProductsFromCms,
  fetchProductFromCms,
} from "@/domain/cms/actions";
import { getProductLimits } from "@/domain/product/actions/getProductLimits";
import { isProductSellable } from "@/domain/product/businessLogic";
import parse from "html-react-parser";
import ProductCard from "@/components/product/ProductCard";
import clsx from "clsx";
import InnerPage from "@/components/InnerPage";
import PageHeadline from "@/components/PageHeadline";
import OuterPage from "@/components/OuterPage";
import style from "@/styles/insetHtml.module.css";
import { notFound } from "next/navigation";

export const revalidate = 3600; // Revalidate cache every hour

export async function generateStaticParams() {
  const products = await fetchProductsFromCms({});

  if (!products || products.length === 0) {
    return [];
  }

  return products.map(product => ({
    productUid: product.uid,
  }));
}

// TODO Nejc
// export async function generateMetadata({
//   params,
// }: {
//   params: { uid: string };
// }): Promise<Metadata> {
//   const prismicProduct = (await prismic
//     .getByUID("product", params.uid)
//     .catch(() => null)) as PrismicProductDocument;
//
//   if (!prismicProduct) {
//     return {
//       title: "Product Not Found",
//     };
//   }
//
//   const product = formatProduct(prismicProduct);
//
//   return {
//     title: product.data.meta_title || product.data.title,
//     description:
//       product.meta_description ||
//       richTextToPlainText(product.data.description),
//     openGraph: {
//       title: product.data.meta_title || product.data.title,
//       description:
//         product.data.meta_description ||
//         richTextToPlainText(product.data.description),
//       images: product.data.meta_image?.url
//         ? [{ url: product.data.meta_image.url }]
//         : product.images.length > 0
//           ? [{ url: product.images[0].src }]
//           : [],
//     },
//   };
// }

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    productUid: string;
  }>;
}) {
  const { productUid } = await params;

  const product = await fetchProductFromCms(productUid);

  if (!product) {
    notFound();
  }

  const productLimits = getProductLimits(product);
  const isSellableObject = isProductSellable(product);
  const relatedProducts = product.relatedProducts;

  return (
    <OuterPage>
      <PageHeadline
        title={product.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: product.category, path: createSlug(product.category) },
          { label: product.name, path: product.uid },
        ]}
      />

      <InnerPage>
        <div
          className={
            "absolute w-full blur-xl inset h-full top-0 mix-blend-multiply opacity-50"
          }
          style={{
            backgroundImage: `url('${product.images[0]?.src}')`,
            backgroundRepeat: "repeat",
            backgroundBlendMode: "color-burn",
            backgroundSize: "1500px",
          }}
        ></div>
        <ProductStatusTag
          status={product.status}
          className={"translate-y-4 translate-x-4 relative"}
        />

        <ImageGallery images={product.images} altFallbackText={product.name} />

        <div className={"lg:flex mt-12 lg:mt-8 relative"}>
          <div
            className={"lg:border-r lg:border-neutral-500 lg:pr-20 lg:w-2/3"}
          >
            <h3 className="sr-only">Description</h3>

            <div className={`space-y-6 ${style.inset}`}>
              {parse(product.description)}
            </div>
          </div>
          <div
            className={
              "px-2 flex-1 lg:pl-10 flex flex-col items-center max-lg:border-neutral-500 max-lg:border-t max-lg:mt-10 max-lg:pt-10"
            }
          >
            <div>Price:</div>
            <div
              className={clsx(
                "text-4xl font-heading mb-6",
                !isSellableObject.isSellable && "line-through"
              )}
            >
              {formatDecimalPrice(product.price)}
            </div>

            <ProductConfigure product={product} />

            {!isSellableObject.isSellable &&
              !isSellableObject.isSellableByCutoffDate && (
                <div className={"uppercase font-bold"}>
                  Product no longer available
                </div>
              )}

            {!isSellableObject.isSellable &&
              !isSellableObject.isSellableByStatus && (
                <div className={"uppercase font-bold"}>
                  {getStatusText(product.status)}
                </div>
              )}

            {productLimits && (
              <div
                className={
                  "border-t border-neutral-500 mt-6 pt-6 text-sm text-neutral-400"
                }
              >
                {productLimits.map((productLimit, index) => (
                  <div key={`prod-limit-${index}`}>{productLimit}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </InnerPage>
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-20 mb-10 text-center">
          <h3 className={"text-neutral-200 text-2xl py-6"}>
            You might also like
          </h3>
          <div className={"flex gap-0.5 flex-wrap"}>
            {relatedProducts.map((relatedProduct, index) => (
              <ProductCard
                status={relatedProduct.status}
                key={`related-${relatedProduct.id}-${index}`}
                image={relatedProduct.images[0]}
                name={relatedProduct.title}
                uid={relatedProduct.uid}
                price={relatedProduct.price}
                category={relatedProduct.category}
                callToAction={relatedProduct.callToAction}
              />
            ))}
          </div>
        </div>
      )}
    </OuterPage>
  );
}

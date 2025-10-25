import { getSlugFromText } from "@/lib/util/util";
import ProductStatusTag from "@/app/_components/product/ProductStatusTag";
import ImageGalleryWithMasonry from "@/app/_components/content/ImageGalleryWithMasonry";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";
import ProductCard from "@/app/_components/product/ProductCard";
import InnerPage from "@/app/_components/content/InnerPage";
import PageHeadline from "@/app/_components/content/PageHeadline";
import OuterPage from "@/app/_components/content/OuterPage";
import style from "@/app/_styles/insetHtml.module.css";
import { notFound } from "next/navigation";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";

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

  const product = await fetchProductFromCmsByUid(productUid);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.relatedProducts;

  return (
    <OuterPage>
      <PageHeadline
        title={product.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: product.category, path: getSlugFromText(product.category) },
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

        <ImageGalleryWithMasonry
          images={product.images}
          altFallbackText={product.name}
        />

        <div className={"lg:flex mt-12 lg:mt-8 relative"}>
          <div
            className={"lg:border-r lg:border-neutral-500 lg:pr-20 lg:w-2/3"}
          >
            <h3 className="sr-only">Description</h3>

            <div className={`space-y-6 ${style.inset}`}>
              <RichTextDisplay richText={product.description} />
            </div>
          </div>
          <div
            className={
              "px-2 flex-1 lg:pl-10 flex flex-col items-center max-lg:border-neutral-500 max-lg:border-t max-lg:mt-10 max-lg:pt-10"
            }
          >
            <ProductAddToCart product={product} />
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

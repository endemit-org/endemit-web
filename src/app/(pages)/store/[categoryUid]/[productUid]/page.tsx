import { getResizedPrismicImage, getSlugFromText } from "@/lib/util/util";
import ProductStatusTag from "@/app/_components/product/ProductStatusTag";
import ImageGalleryWithMasonry from "@/app/_components/content/ImageGalleryWithMasonry";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";
import ProductCard from "@/app/_components/product/ProductCard";
import InnerPage from "@/app/_components/ui/InnerPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import style from "@/app/_styles/insetHtml.module.css";
import { notFound } from "next/navigation";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { Metadata } from "next";
import { prismic } from "@/lib/services/prismic";
import SliceDisplay from "@/app/_components/content/SliceDisplay";
import clsx from "clsx";
import ProductSeoMicrodata from "@/app/_components/seo/ProductSeoMicrodata";
import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import { buildOpenGraphImages } from "@/lib/util/seo";

export async function generateStaticParams() {
  const products = await fetchProductsFromCms({});

  if (!products || products.length === 0) {
    return [];
  }

  return products.map(product => ({
    productUid: product.uid,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    productUid: string;
  }>;
}): Promise<Metadata> {
  const { productUid } = await params;
  const product = await fetchProductFromCmsByUid(productUid);

  if (!product) {
    notFound();
  }

  const title = `${product.meta.title ?? product.name} • ${product.category}`;
  const description =
    product?.meta.description ?? prismic.asText(product.description);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: buildOpenGraphImages({
        metaImage: product.meta.image,
        fallbackImages: product.images
          ? product.images.map(image => image.src)
          : undefined,
      }),
    },
  };
}

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

  const relatedEvent = product.relatedEvent
    ? await fetchEventFromCmsByUid(product.relatedEvent.uid)
    : null;

  return (
    <>
      <ProductSeoMicrodata product={product} />
      <OuterPage>
        <PageHeadline
          title={product.name}
          segments={[
            { label: "Endemit", path: "" },
            { label: "Store", path: "store" },
            {
              label: product.category,
              path: getSlugFromText(product.category),
            },
            { label: product.name, path: product.uid },
          ]}
        />

        <InnerPage>
          <div
            className={
              "absolute w-full blur-xl inset h-full top-0 mix-blend-multiply opacity-50"
            }
            style={
              product.images[0]
                ? {
                    backgroundImage: `url('${getResizedPrismicImage(product.images[0]?.src, { width: 400, quality: 50 })}')`,
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "color-burn",
                    backgroundSize: "1500px",
                  }
                : {}
            }
          ></div>
          <ProductStatusTag
            status={product.status}
            className={"translate-y-4 translate-x-4 relative"}
          />

          <ImageGalleryWithMasonry
            images={product.images}
            altFallbackText={product.name}
            relatedEvent={relatedEvent}
          />

          <div className={"lg:flex mt-12 lg:mt-8 relative"}>
            <div
              className={"lg:border-r lg:border-neutral-500 lg:pr-20 lg:w-2/3"}
            >
              <h3 className="sr-only">Description</h3>

              {product.slices &&
                product.displaySlicePosition === "Above description" && (
                  <SliceDisplay slices={product.slices} />
                )}

              <div className={`space-y-6 ${style.inset}`}>
                <RichTextDisplay richText={product.description} />
              </div>

              {product.slices &&
                product.displaySlicePosition === "Below description" && (
                  <SliceDisplay slices={product.slices} />
                )}
            </div>
            <div
              className={
                "px-2 flex-1 lg:pl-10 flex flex-col items-center max-lg:border-neutral-500 max-lg:border-t max-lg:mt-10 max-lg:pt-10"
              }
            >
              <ProductAddToCart product={product} />

              {product.video && (
                <div className="aspect-square w-full  object-cover mt-10 rounded-lg overflow-hidden">
                  <video
                    src={product.video}
                    loop={true}
                    muted={true}
                    autoPlay={true}
                    playsInline={true}
                  />
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
            <div
              className={clsx(
                "sm:grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 w-full gap-2"
              )}
            >
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
    </>
  );
}

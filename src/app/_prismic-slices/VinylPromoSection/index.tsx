import React, { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Image from "next/image";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import InnerPage from "@/app/_components/content/InnerPage";

/**
 * Props for `VinylPromoSection`.
 */
export type VinylPromoSectionProps =
  SliceComponentProps<Content.VinylPromoSectionSlice>;

/**
 * Component for "VinylPromoSection" Slices.
 */
const VinylPromoSection: FC<VinylPromoSectionProps> = async ({ slice }) => {
  if (!slice.primary.product) {
    return;
  }
  const productObject = slice.primary.product;

  // @ts-expect-error - ID does exist on the product
  const product = await fetchProductFromCmsById(productObject.id);

  if (!product) {
    return;
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <InnerPage
        className={
          "flex overflow-hidden gap-x-20 bg-[#d3532c] justify-evenly max-lg:flex-col max-lg:gap-y-10 items-center"
        }
      >
        <div className="absolute bottom-0  right-0 scale-[200%]">
          <Image
            src="/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp"
            alt="Issun-bōshi  Vinyl release"
            width={400}
            height={400}
            className=" blur-2xl animate-blurred-backdrop"
          />
        </div>
        <div className="relative z-10 group pt-[20%] max-lg:pointer-events-none">
          <Image
            src="/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp"
            alt="Issun-bōshi  Vinyl release"
            width={400}
            height={400}
            className="z-10 relative "
          />
          <div className="absolute top-0">
            <Image
              src="/images/issun-boshi-vinyl-release/album/issun-boshi-record.webp"
              alt="Issun-bōshi  Vinyl release"
              width={400}
              height={400}
              className="animate-slow-spin"
            />
          </div>
        </div>
        <div className="relative z-10 text-center max-w-md">
          <h2 className={"text-4xl mt-6"}>{slice.primary.headline}</h2>
          <div className={"font-light pt-0 text-lg"}>MMali • Issun-bōshi</div>

          <div className={"text-xl my-6 font-thin"}>
            {slice.primary.description}
          </div>

          <ProductAddToCart product={product} />
        </div>
      </InnerPage>
    </section>
  );
};

export default VinylPromoSection;

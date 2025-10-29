import React, { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Image from "next/image";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import InnerPage from "@/app/_components/content/InnerPage";
import Link from "next/link";
import ActionButton from "@/app/_components/form/ActionButton";
import InnerClientToggle from "@/app/_prismic-slices/VinylPromoSection/InnerClientToggle";

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
          "flex overflow-hidden gap-x-20 !bg-[#d3532c] justify-evenly max-lg:flex-col max-lg:gap-y-10 items-center"
        }
      >
        <div className="absolute bottom-0  right-0 scale-[200%]">
          <Image
            src="/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp"
            alt="Issun-bōshi  Vinyl release"
            width={600}
            height={600}
            quality={100}
            className=" blur-2xl animate-blurred-backdrop"
          />
        </div>

        <div className="relative z-10 group pt-[20%]  group">
          <InnerClientToggle />
          <div className="absolute top-0">
            <Image
              src="/images/issun-boshi-vinyl-release/album/issun-boshi-record.webp"
              alt="Issun-bōshi  Vinyl release"
              width={600}
              height={600}
              quality={100}
              className="animate-slow-spin"
            />
          </div>
        </div>
        {slice.primary.display_add_to_cart && (
          <div className="relative z-10 text-center max-w-md">
            <h2 className={"text-4xl mt-6"}>
              <Link
                href={"/store/albums/issun-boshi-vinyl-ep"}
                className={"link text-neutral-200 hover:text-neutral-300"}
              >
                {slice.primary.headline}
              </Link>
            </h2>
            <div className={"font-light pt-0 text-lg"}>MMali • Issun-bōshi</div>
            <div className={"text-xl my-6 font-thin"}>
              {slice.primary.description}
            </div>
            <ProductAddToCart product={product} />
            <div className={"mt-3 gap-y-3 flex flex-col  items-center"}>
              <div>or</div>
              <div className={"w-fit"}>
                <ActionButton
                  variant={"secondary"}
                  openInNewTab={true}
                  size={"sm"}
                  href={"https://endemit.bandcamp.com/album/issun-boshi"}
                >
                  Buy digital album
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </InnerPage>
    </section>
  );
};

export default VinylPromoSection;

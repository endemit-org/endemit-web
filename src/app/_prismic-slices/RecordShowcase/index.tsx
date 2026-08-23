import React, { FC } from "react";
import { Content, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import { ProductStatus, type Product } from "@/domain/product/types/product";
import InnerPage from "@/app/_components/ui/InnerPage";
import { Link } from "@/i18n/navigation";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import { formatPrice } from "@/lib/util/formatting";
import { getTranslations } from "next-intl/server";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `RecordShowcase`.
 */
export type RecordShowcaseProps = SliceComponentProps<
  Content.RecordShowcaseSlice,
  SliceContext
>;

/** Same legacy art the album promo falls back to (see VinylPromoSection). */
const FALLBACK_COVER = "/images/album-promo/issun-boshi-cover.webp";
const FALLBACK_RECORD = "/images/album-promo/issun-boshi-record.webp";

type ShowcaseRecord = {
  product: Product;
  coverImage: string;
  recordImage: string;
};

/**
 * Component for "RecordShowcase" Slices: the label / založba section — a grid
 * of releases rendered like mini album promos (cover with the spinning vinyl
 * peeking out behind). Each item links to its product page; availability
 * (pre-order / sold out…) comes from the product. Per-item cover/record art is
 * optional — unset fields fall back to the product image and the Issun-bōshi
 * record art.
 */
const RecordShowcase: FC<RecordShowcaseProps> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  const t = await getTranslations({ locale, namespace: "store" });

  const records: ShowcaseRecord[] = (
    await Promise.all(
      slice.items.map(async item => {
        if (!item.product || !("id" in item.product)) return null;

        const product = await fetchProductFromCmsById(
          item.product.id as string,
          locale
        );
        if (!product || !isProductVisible(product)) return null;

        return {
          product,
          coverImage: isFilled.image(item.cover_image)
            ? item.cover_image.url!
            : (product.images[0]?.src ?? FALLBACK_COVER),
          recordImage: isFilled.image(item.record_image)
            ? item.record_image.url!
            : FALLBACK_RECORD,
        };
      })
    )
  ).filter((record): record is ShowcaseRecord => record !== null);

  if (records.length === 0) return null;

  const title = pickLocalized(slice.primary, "title", locale);
  const description = pickLocalized(slice.primary, "description", locale);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <InnerPage>
        {title && (
          <h2 className="text-4xl font-heading uppercase tracking-wider text-neutral-200 mb-2">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-neutral-400 font-thin text-lg mb-8">
            {description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 mt-8">
          {records.map(({ product, coverImage, recordImage }) => {
            const showStatus = product.status !== ProductStatus.AVAILABLE;

            return (
              <Link
                key={product.id}
                href={getProductLink(product.uid, product.category)}
                className="group block"
              >
                {/* Cover with the record peeking out behind; on hover the
                    record slides further out of the sleeve. */}
                <div className="relative pr-[18%]">
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[82%] transition-transform duration-500 ease-out group-hover:translate-x-[10%]">
                    <ImageWithFallback
                      src={recordImage}
                      alt=""
                      width={400}
                      height={400}
                      quality={80}
                      className="animate-slow-spin rounded-full w-full"
                    />
                  </div>
                  <ImageWithFallback
                    src={coverImage}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="relative z-10 w-full shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
                  />
                  {showStatus && (
                    <span className="absolute z-20 top-3 left-3 bg-neutral-950/80 backdrop-blur-sm text-neutral-200 text-xs uppercase tracking-wider font-heading px-2 py-1 rounded">
                      {t(
                        product.status === ProductStatus.PREORDER
                          ? "product.statusText.preorder"
                          : product.status === ProductStatus.COMING_SOON
                            ? "product.statusText.comingSoon"
                            : product.status === ProductStatus.OUT_OF_STOCK
                              ? "product.statusText.outOfStock"
                              : "product.statusText.soldOut"
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-4 pr-[18%]">
                  <div className="text-neutral-200 text-lg group-hover:text-neutral-400 transition-colors">
                    {product.name}
                  </div>
                  <div className="text-neutral-500 text-sm">
                    {formatPrice(product.price)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </InnerPage>
    </section>
  );
};

export default RecordShowcase;

import React, { FC } from "react";
import { Content, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import { ProductStatus, type Product } from "@/domain/product/types/product";
import InnerPage from "@/app/_components/ui/InnerPage";
import RecordShowcaseCard from "./RecordShowcaseCard";
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
            const statusText =
              product.status === ProductStatus.AVAILABLE
                ? null
                : t(
                    product.status === ProductStatus.PREORDER
                      ? "product.statusText.preorder"
                      : product.status === ProductStatus.COMING_SOON
                        ? "product.statusText.comingSoon"
                        : product.status === ProductStatus.OUT_OF_STOCK
                          ? "product.statusText.outOfStock"
                          : "product.statusText.soldOut"
                  );

            return (
              <RecordShowcaseCard
                key={product.id}
                href={getProductLink(product.uid, product.category)}
                name={product.name}
                price={formatPrice(product.price)}
                statusText={statusText}
                coverImage={coverImage}
                recordImage={recordImage}
              />
            );
          })}
        </div>
      </InnerPage>
    </section>
  );
};

export default RecordShowcase;

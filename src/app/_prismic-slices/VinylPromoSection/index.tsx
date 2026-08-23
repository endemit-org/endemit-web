import React, { FC } from "react";
import { Content, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { fetchProductFromCmsById } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import InnerPage from "@/app/_components/ui/InnerPage";
import { Link } from "@/i18n/navigation";
import ActionButton from "@/app/_components/form/ActionButton";
import InnerClientToggle from "@/app/_prismic-slices/VinylPromoSection/InnerClientToggle";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import { getTranslations } from "next-intl/server";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `VinylPromoSection`.
 */
export type VinylPromoSectionProps = SliceComponentProps<
  Content.VinylPromoSectionSlice,
  SliceContext
>;

/**
 * Legacy defaults — the slice predates the per-album fields and the live
 * Issun-bōshi document doesn't have them filled yet. Any slice with an empty
 * cover image falls back to this bundle so nothing breaks mid-migration.
 * Remove once the Prismic doc carries its own graphics/tracks.
 */
const LEGACY_ISSUN_BOSHI = {
  artistName: "MMali",
  albumTitle: "Issun-bōshi",
  coverImage: "/images/album-promo/issun-boshi-cover.webp",
  recordImage: "/images/album-promo/issun-boshi-record.webp",
  backgroundColor: "#d3532c",
  digitalLink: "https://endemit.bandcamp.com/album/issun-boshi",
  playlistUrl: "https://soundcloud.com/ende-mit/sets/mmali-issun-boshi",
  tracks: [
    {
      title: "Inori 祈り",
      artist: "MMali",
      url: "https://soundcloud.com/ende-mit/mmali-inori?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Gensō 幻想",
      artist: "MMali",
      url: "https://soundcloud.com/ende-mit/mmali-genso?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Matsuri 祭 (Inland Endemit Dub)",
      artist: "MMali, Inland",
      url: "https://soundcloud.com/ende-mit/mmali-matsuri-inland-endemit-dub?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Matsuri 祭",
      artist: "MMali",
      url: "https://soundcloud.com/ende-mit/mmali-matsuri?in=ende-mit/sets/mmali-issun-boshi",
    },
  ],
};

/**
 * Component for "VinylPromoSection" Slices: per-album promo driven entirely by
 * Prismic content. Availability (pre-order / sold out / …) comes from the
 * linked product via ProductAddToCart; track previews are optional — with no
 * tracks and no playlist the cover renders statically without the listen UI.
 */
const VinylPromoSection: FC<VinylPromoSectionProps> = async ({
  slice,
  context,
}) => {
  const locale = context?.locale ?? "sl";
  const t = await getTranslations({ locale, namespace: "music.vinylPromo" });
  if (!slice.primary.product) {
    return;
  }

  const productObject = slice.primary.product;

  // @ts-expect-error - ID does exist on the product
  const product = await fetchProductFromCmsById(productObject.id, locale);

  // Don't promote a product that isn't publicly visible.
  if (!product || !isProductVisible(product)) {
    return;
  }

  const useLegacy = !isFilled.image(slice.primary.cover_image);

  const artistName = useLegacy
    ? LEGACY_ISSUN_BOSHI.artistName
    : (slice.primary.artist_name ?? "");
  const albumTitle = useLegacy
    ? LEGACY_ISSUN_BOSHI.albumTitle
    : (slice.primary.album_title ?? "");
  const coverImage = useLegacy
    ? LEGACY_ISSUN_BOSHI.coverImage
    : slice.primary.cover_image.url!;
  const recordImage = useLegacy
    ? LEGACY_ISSUN_BOSHI.recordImage
    : isFilled.image(slice.primary.record_image)
      ? slice.primary.record_image.url!
      : null;
  const backgroundColor =
    (useLegacy ? null : slice.primary.background_color) ??
    LEGACY_ISSUN_BOSHI.backgroundColor;
  const digitalLink = useLegacy
    ? LEGACY_ISSUN_BOSHI.digitalLink
    : isFilled.link(slice.primary.digital_link)
      ? slice.primary.digital_link.url
      : null;
  const playlistUrl = useLegacy
    ? LEGACY_ISSUN_BOSHI.playlistUrl
    : isFilled.keyText(slice.primary.soundcloud_playlist_url)
      ? slice.primary.soundcloud_playlist_url.trim()
      : null;
  const tracks = useLegacy
    ? LEGACY_ISSUN_BOSHI.tracks
    : slice.items
        .filter(item => item.track_title && item.track_url)
        .map(item => ({
          title: item.track_title!,
          artist: item.track_artist || artistName,
          url: item.track_url!,
        }));

  const hasPreviews = tracks.length > 0 || Boolean(playlistUrl);
  const productLink = getProductLink(product.uid, product.category);
  const albumAlt = `${artistName} • ${albumTitle}`;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <InnerPage
        className={
          "flex overflow-hidden gap-x-20 justify-evenly max-lg:flex-col max-lg:gap-y-10 items-center"
        }
        style={{ backgroundColor }}
      >
        <div className="absolute bottom-0 right-0 scale-[200%]">
          <ImageWithFallback
            src={coverImage}
            alt={albumAlt}
            width={400}
            height={400}
            quality={50}
            className="blur-2xl animate-blurred-backdrop"
          />
        </div>

        <div className="relative z-10 group pt-[20%] group">
          {hasPreviews ? (
            <InnerClientToggle
              coverImage={coverImage}
              coverAlt={albumAlt}
              artistName={artistName}
              albumTitle={albumTitle}
              playlistUrl={playlistUrl}
              tracks={tracks}
            />
          ) : (
            <div className="relative overflow-hidden z-20">
              <ImageWithFallback
                src={coverImage}
                alt={albumAlt}
                width={400}
                height={400}
                className="z-10 relative"
              />
            </div>
          )}
          {recordImage && (
            <div className="absolute top-0">
              <ImageWithFallback
                src={recordImage}
                alt={`${albumAlt} vinyl`}
                width={600}
                height={600}
                quality={100}
                className="animate-slow-spin rounded-full"
              />
            </div>
          )}
        </div>
        {slice.primary.display_add_to_cart && (
          <div className="relative z-10 text-center max-w-md">
            <h2 className={"text-4xl mt-6"}>
              <Link
                href={productLink}
                className={"link text-neutral-200 hover:text-neutral-300"}
              >
                {pickLocalized(slice.primary, "headline", locale)}
              </Link>
            </h2>
            {(artistName || albumTitle) && (
              <div className={"font-light pt-0 text-lg"}>
                {[artistName, albumTitle].filter(Boolean).join(" • ")}
              </div>
            )}
            <div className={"text-xl my-6 font-thin"}>
              {pickLocalized(slice.primary, "description", locale)}
            </div>
            <ProductAddToCart product={product} />
            {digitalLink && (
              <div className={"mt-3 gap-y-3 flex flex-col items-center"}>
                <div>{t("or")}</div>
                <div className={"w-fit"}>
                  <ActionButton
                    variant={"secondary"}
                    openInNewTab={true}
                    size={"sm"}
                    href={digitalLink}
                  >
                    {t("buyDigital")}
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        )}
      </InnerPage>
    </section>
  );
};

export default VinylPromoSection;

import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Hero from "@/app/_components/content/Hero";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";
import { renderHeadingEffect } from "@/app/_components/theme/effectRegistry";
import clsx from "clsx";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice, SliceContext>;

/**
 * Component for "Hero" Slices.
 */
const HeroSlice: FC<HeroProps> = async ({ slice, context }) => {
  const { primary } = slice;
  const locale = context?.locale ?? "sl";

  const localizedHeading = pickLocalized(primary, "heading", locale);
  const heading = isFilled.richText(localizedHeading)
    ? asText(localizedHeading)
    : "";

  const localizedDescription = pickLocalized(primary, "description", locale);
  const description = isFilled.richText(localizedDescription)
    ? asText(localizedDescription)
    : "";

  const link = isFilled.link(primary.primaryCtaLink)
    ? primary.primaryCtaLink.url
    : undefined;

  const backgroundImage = isFilled.image(primary.backgroundImage)
    ? {
        src: primary.backgroundImage.url,
        alt: primary.backgroundImage.alt || "",
        placeholder: await getBlurDataURL(primary.backgroundImage.url),
      }
    : undefined;

  const backgroundVideo = isFilled.link(primary.background_video)
    ? primary.background_video.url
    : undefined;

  const vimeoVideoId = isFilled.keyText(primary.vimeo_video_id)
    ? primary.vimeo_video_id
    : undefined;

  // Per-theme override for this slice type (undefined on general/other themes).
  const override = context?.theme?.slices?.[slice.slice_type];
  const headingSlot =
    override?.variant === "crt" && heading
      ? renderHeadingEffect(context?.theme?.headingEffect, heading)
      : undefined;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={clsx(override?.className)}
    >
      <Hero
        heading={heading}
        headingSlot={headingSlot}
        description={description}
        link={link}
        backgroundImage={backgroundImage}
        backgroundVideo={backgroundVideo}
        vimeoVideoId={vimeoVideoId}
        overlayOpacity={primary.overlayOpacity || 50}
        specialMarker={primary.special_marker as "None" | "Tickets available"}
      />
    </section>
  );
};

export default HeroSlice;

import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Hero from "@/app/_components/content/Hero";
import { getBlurDataURL } from "@/lib/util/util";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const HeroSlice: FC<HeroProps> = async ({ slice }) => {
  const { primary } = slice;

  const heading = isFilled.richText(primary.heading)
    ? asText(primary.heading)
    : "";

  const description = isFilled.richText(primary.description)
    ? asText(primary.description)
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

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Hero
        heading={heading}
        description={description}
        link={link}
        backgroundImage={backgroundImage}
        backgroundVideo={backgroundVideo}
        overlayOpacity={primary.overlayOpacity || 50}
        specialMarker={primary.special_marker as "None" | "Tickets available"}
      />
    </section>
  );
};

export default HeroSlice;

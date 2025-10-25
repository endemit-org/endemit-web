import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Hero from "@/app/_components/content/Hero";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const HeroSlice: FC<HeroProps> = ({ slice }) => {
  const { primary } = slice;

  const heading = isFilled.richText(primary.heading)
    ? asText(primary.heading)
    : "";

  const description = isFilled.richText(primary.description)
    ? asText(primary.description)
    : "";

  const primaryCta =
    isFilled.keyText(primary.primaryCtaText) &&
    isFilled.link(primary.primaryCtaLink)
      ? {
          text: primary.primaryCtaText,
          href: primary.primaryCtaLink.url || "#",
        }
      : undefined;

  const secondaryCta =
    isFilled.keyText(primary.secondaryCtaText) &&
    isFilled.link(primary.secondaryCtaLink)
      ? {
          text: primary.secondaryCtaText,
          href: primary.secondaryCtaLink.url || "#",
        }
      : undefined;

  const backgroundImage = isFilled.image(primary.backgroundImage)
    ? {
        src: primary.backgroundImage.url,
        alt: primary.backgroundImage.alt || "",
      }
    : undefined;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Hero
        heading={heading}
        description={description}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        backgroundImage={backgroundImage}
        textAlignment={primary.textAlignment || "center"}
        overlayOpacity={primary.overlayOpacity || 50}
      />
    </section>
  );
};

export default HeroSlice;

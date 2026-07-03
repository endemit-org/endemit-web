import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import BannerComponent from "@/app/_components/ui/Banner";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";
/**
 * Props for `Banner`.
 */
export type BannerProps = SliceComponentProps<Content.BannerSlice, SliceContext>;

/**
 * Component for "Banner" Slices.
 */
const Banner: FC<BannerProps> = ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <BannerComponent title={pickLocalized(slice.primary, "title", locale)}>
        <RichTextDisplay
          richText={pickLocalized(slice.primary, "description", locale)}
        />
      </BannerComponent>
    </section>
  );
};

export default Banner;

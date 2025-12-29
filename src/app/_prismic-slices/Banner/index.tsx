import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import BannerComponent from "@/app/_components/ui/Banner";
/**
 * Props for `Banner`.
 */
export type BannerProps = SliceComponentProps<Content.BannerSlice>;

/**
 * Component for "Banner" Slices.
 */
const Banner: FC<BannerProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <BannerComponent title={slice.primary.title}>
        <RichTextDisplay richText={slice.primary.description} />
      </BannerComponent>
    </section>
  );
};

export default Banner;

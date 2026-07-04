import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ImageGalleryWithLightbox from "@/app/_components/content/ImageGalleryWithLightbox";
import InnerPage from "@/app/_components/ui/InnerPage";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

export type ImageGalleryProps = SliceComponentProps<
  Content.ImageGallerySlice,
  SliceContext
>;

const ImageGallerySlice: FC<ImageGalleryProps> = async ({ slice, context }) => {
  const { primary, items } = slice;
  const locale = context?.locale ?? "sl";

  const localizedHeading = pickLocalized(primary, "heading", locale);
  const heading = isFilled.richText(localizedHeading)
    ? asText(localizedHeading)
    : undefined;

  const images = await Promise.all(
    items
      .filter(item => isFilled.image(item.image) && item.image.url)
      .map(async item => {
        const caption = pickLocalized(item, "caption", locale);
        return {
          src: item.image.url!,
          alt: item.image.alt || "",
          caption: isFilled.keyText(caption) ? caption : undefined,
          placeholder: await getBlurDataURL(item.image.url!),
        };
      })
  );

  const gallery = (
    <ImageGalleryWithLightbox
      heading={heading}
      images={images}
      layout={primary.layout || "grid"}
      columns={primary.columns || "3"}
    />
  );

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {primary.include_frame ? <InnerPage>{gallery}</InnerPage> : gallery}
    </section>
  );
};

export default ImageGallerySlice;

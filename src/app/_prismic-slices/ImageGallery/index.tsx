import { FC } from "react";
import { Content, isFilled, asText } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ImageGalleryWithLightbox from "@/app/_components/content/ImageGalleryWithLightbox";
import InnerPage from "@/app/_components/content/InnerPage";

export type ImageGalleryProps = SliceComponentProps<Content.ImageGallerySlice>;

const ImageGallerySlice: FC<ImageGalleryProps> = ({ slice }) => {
  const { primary, items } = slice;

  const heading = isFilled.richText(primary.heading)
    ? asText(primary.heading)
    : undefined;

  const images = items
    .filter(item => isFilled.image(item.image) && item.image.url)
    .map(item => ({
      src: item.image.url!,
      alt: item.image.alt || "",
      caption: isFilled.keyText(item.caption) ? item.caption : undefined,
    }));

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

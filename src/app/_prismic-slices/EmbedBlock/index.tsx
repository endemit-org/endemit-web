import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";

/**
 * Props for `EmbedBlock`.
 */
export type EmbedBlockProps = SliceComponentProps<Content.EmbedBlockSlice>;

/**
 * Component for "EmbedBlock" Slices.
 */
const EmbedBlock = ({ slice }: EmbedBlockProps) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <PrismicRichText field={slice.primary.heading} />
      <PrismicRichText
        field={slice.primary.content}
        components={{
          paragraph: ({ children }) => <p className="text-lg">{children}</p>,
        }}
      />
      {slice.primary.media.html && (
        <div className="popout relative rounded-lg mt-6">
          <div
            dangerouslySetInnerHTML={{ __html: slice.primary.media.html }}
            className="w-full aspect-video [&>*]:w-full [&>*]:h-full"
          />
        </div>
      )}
    </section>
  );
};

export default EmbedBlock;

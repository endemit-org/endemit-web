import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `EmbedBlock`.
 */
export type EmbedBlockProps = SliceComponentProps<
  Content.EmbedBlockSlice,
  SliceContext
>;

/**
 * Component for "EmbedBlock" Slices.
 */
const EmbedBlock = ({ slice, context }: EmbedBlockProps) => {
  const locale = context?.locale ?? "sl";
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <PrismicRichText field={pickLocalized(slice.primary, "heading", locale)} />
      <PrismicRichText
        field={pickLocalized(slice.primary, "content", locale)}
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

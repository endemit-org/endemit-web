import { asLink, Content, isFilled } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import Image from "next/image";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `TextColumn`.
 */
export type TextColumnProps = SliceComponentProps<
  Content.TextColumnSlice,
  SliceContext
>;

/**
 * Type guard to check if a column has an image.
 */
const hasImage = (
  column:
    | Content.TextColumnSliceDefaultPrimaryColumnsItem
    | Content.TextColumnSliceColumnWithImagePrimaryColumnsItem
): column is Content.TextColumnSliceColumnWithImagePrimaryColumnsItem => {
  // An unfilled Prismic image is still a truthy object ({}), so check that it
  // actually holds a url — next/image throws on a missing src.
  return isFilled.image(
    (column as Content.TextColumnSliceColumnWithImagePrimaryColumnsItem).image
  );
};

/**
 * Component for "TextColumn" Slices.
 */
const TextColumn = ({ slice, context }: TextColumnProps) => {
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

      <div className="flex max-sm:flex-col max-sm:gap-y-4 gap-6 mt-6">
        {slice.primary.columns.map((column, index) => (
          <div className="flex-1 [&>*:last-child]:mb-0" key={`column-${index}`}>
            {slice.variation === "columnWithImage" && hasImage(column) && (
              <div className="relative w-full mb-6 aspect-square">
                <Image
                  className="rounded-lg object-cover"
                  src={column.image.url!}
                  alt={column.image.alt ?? ""}
                  fill={true}
                />
              </div>
            )}
            <PrismicRichText field={pickLocalized(column, "heading", locale)} />
            <PrismicRichText
              field={pickLocalized(column, "content", locale)}
              components={{
                hyperlink: ({ children, node }) => {
                  const link = asLink(node.data);
                  return (
                    <a
                      className="link !font-medium"
                      href={link!}
                      // target={}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TextColumn;

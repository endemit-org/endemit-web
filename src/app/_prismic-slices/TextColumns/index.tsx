import { asLink, Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import Image from "next/image";

/**
 * Props for `TextColumn`.
 */
export type TextColumnProps = SliceComponentProps<Content.TextColumnSlice>;

/**
 * Type guard to check if a column has an image.
 */
const hasImage = (
  column:
    | Content.TextColumnSliceDefaultPrimaryColumnsItem
    | Content.TextColumnSliceColumnWithImagePrimaryColumnsItem
): column is Content.TextColumnSliceColumnWithImagePrimaryColumnsItem => {
  return (
    (column as Content.TextColumnSliceColumnWithImagePrimaryColumnsItem)
      .image !== undefined
  );
};

/**
 * Component for "TextColumn" Slices.
 */
const TextColumn = ({ slice }: TextColumnProps) => {
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
            <PrismicRichText field={column.heading} />
            <PrismicRichText
              field={column.content}
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

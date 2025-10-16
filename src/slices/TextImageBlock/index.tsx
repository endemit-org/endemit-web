import { asLink, Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";

/**
 * Props for `TextImageBlock`.
 */
export type TextImageBlockProps =
  SliceComponentProps<Content.TextImageBlockSlice>;

/**
 * Component for "TextImageBlock" Slices.
 */
const TextImageBlock = ({ slice }: TextImageBlockProps) => {
  const button = slice.primary.button.shift();

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-10">
        <div className={clsx(slice.variation === "rightAlign" && "order-1")}>
          <PrismicRichText field={slice.primary.maintitle} />
          <PrismicRichText
            field={slice.primary.content}
            components={{
              paragraph: ({ children }) => (
                <p className="text-lg">{children}</p>
              ),
            }}
          />
          {/*{button && (*/}
          {/*  <Link href={asLink(button.link.)!}>*/}
          {/*    <button>{button.label}</button>*/}
          {/*  </Link>*/}
          {/*)}*/}
        </div>
        {slice.primary.image.url && (
          <div className={"aspect-video relative"}>
            <Image
              fill={true}
              className="popout rounded-lg object-cover"
              src={slice.primary.image.url}
              alt={slice.primary.image.alt ?? ""}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default TextImageBlock;

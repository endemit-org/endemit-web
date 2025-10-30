import React, { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import s from "@/app/_prismic-slices/TextBlock/TextBlock.module.css";

/**
 * Props for `Poem`.
 */
export type PoemProps = SliceComponentProps<Content.PoemSlice>;

/**
 * Component for "Poem" Slices.
 */
const Poem: FC<PoemProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={`${s.markdown} `}
    >
      <div className="animate-unblur-text text-center font-light flex flex-col gap-4 text-mg md:text-lg bg-gradient-to-b items-center from-neutral-600 to-neutral-100 bg-clip-text text-transparent px-12 lg:px-20 xl:px-36 py-6 lg:py-20 xl:py-36 ">
        <RichTextDisplay richText={slice.primary.content} />
      </div>
    </section>
  );
};

export default Poem;

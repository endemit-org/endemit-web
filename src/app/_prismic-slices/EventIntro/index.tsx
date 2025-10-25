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
      <div className="text-center font-light flex flex-col gap-4 text-lg bg-gradient-to-b items-center from-neutral-400 to-neutral-200 bg-clip-text text-transparent">
        <RichTextDisplay richText={slice.primary.content} />
      </div>
    </section>
  );
};

export default Poem;

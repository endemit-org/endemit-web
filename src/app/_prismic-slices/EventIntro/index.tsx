import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";
import s from "@/app/_prismic-slices/TextBlock/TextBlock.module.css";

/**
 * Props for `Poem`.
 */
export type PoemProps = SliceComponentProps<Content.PoemSlice, SliceContext>;

/**
 * Component for "Poem" Slices.
 *
 * Server component (no client hooks): the unblur entrance is CSS-only via
 * `animate-unblur-text-in`. This matters because this slice can be rendered by
 * SliceZone inside a Client Component boundary (the event page `Tabs`); a
 * `"use client"` slice there breaks production RSC prerender serialization
 * ($$typeof) even though it works in dev.
 */
const Poem: FC<PoemProps> = ({ slice, context }) => {
  const locale = context?.locale ?? "sl";

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className={`${s.markdown} `}
    >
      <div
        className={
          "text-center font-light flex flex-col gap-4 text-mg md:text-lg bg-gradient-to-b items-center from-neutral-600 to-neutral-100 bg-clip-text text-transparent px-12 lg:px-20 xl:px-36 py-6 lg:py-20 xl:py-36 animate-unblur-text-in"
        }
      >
        <RichTextDisplay
          richText={pickLocalized(slice.primary, "content", locale)}
        />
      </div>
    </section>
  );
};

export default Poem;

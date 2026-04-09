import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `HorizontalRule`.
 */
export type HorizontalRuleProps = SliceComponentProps<Content.HorizontalRuleSlice>;

/**
 * Component for "HorizontalRule" Slices.
 */
const HorizontalRuleSlice: FC<HorizontalRuleProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <hr className="border-t border-neutral-700 my-8" />
    </section>
  );
};

export default HorizontalRuleSlice;

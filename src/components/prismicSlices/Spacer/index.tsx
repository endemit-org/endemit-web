import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import Spacer from "@/components/content/Spacer";

/**
 * Props for `Spacer`.
 */
export type SpacerProps = SliceComponentProps<Content.SpacerSlice>;

/**
 * Component for "Spacer" Slices.
 */
const SpacerSlice: FC<SpacerProps> = ({ slice }) => {
  const { primary } = slice;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <Spacer
        size={primary.size || "medium"}
        mobileSize={primary.mobileSize || "small"}
      />
    </section>
  );
};

export default SpacerSlice;

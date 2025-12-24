"use client";

import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Snowfall as SnowfallComponent } from "react-snowfall";

/**
 * Props for `Snowfall`.
 */
export type SnowfallProps = SliceComponentProps<Content.SnowfallSlice>;

/**
 * Component for "Snowfall" Slices.
 */
const Snowfall: FC<SnowfallProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <SnowfallComponent
        snowflakeCount={300}
        style={{
          position: "absolute",
          width: "100vw",
          height: "200vh",
          zIndex: "999",
          top: 0,
        }}
      />
    </section>
  );
};

export default Snowfall;

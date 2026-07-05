import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import VenueLister from "@/app/_components/venue/VenueLister";
import { fetchVenuesFromCms } from "@/domain/cms/operations/fetchVenuesFromCms";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `VenueList`.
 */
export type VenueListProps = SliceComponentProps<
  Content.VenueListSlice,
  SliceContext
>;

/**
 * Component for "VenueList" Slices.
 */
const VenueList: FC<VenueListProps> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  const venues = await fetchVenuesFromCms({});

  if (!venues || !venues.length) {
    return null;
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <VenueLister
        venues={venues}
        title={pickLocalized(slice.primary, "title", locale) ?? undefined}
      />
    </section>
  );
};

export default VenueList;

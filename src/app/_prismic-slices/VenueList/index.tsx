import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import VenueLister from "@/app/_components/venue/VenueLister";
import { fetchVenuesFromCms } from "@/domain/cms/operations/fetchVenuesFromCms";

/**
 * Props for `VenueList`.
 */
export type VenueListProps = SliceComponentProps<Content.VenueListSlice>;

/**
 * Component for "VenueList" Slices.
 */
const VenueList: FC<VenueListProps> = async ({ slice }) => {
  const venues = await fetchVenuesFromCms({});

  if (!venues || !venues.length) {
    return null;
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <VenueLister venues={venues} title={slice.primary.title ?? undefined} />
    </section>
  );
};

export default VenueList;

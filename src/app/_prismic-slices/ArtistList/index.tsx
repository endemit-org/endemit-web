import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import ArtistAlphabeticalList from "@/app/_components/artist/ArtistAlphabeticalList";

/**
 * Props for `ArtistList`.
 */
export type ArtistListProps = SliceComponentProps<Content.ArtistListSlice>;

/**
 * Component for "ArtistList" Slices.
 */
const ArtistList: FC<ArtistListProps> = async ({ slice }) => {
  const artists = await fetchArtistsFromCms({});

  if (!artists || !artists.length) {
    return null;
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <ArtistAlphabeticalList artists={artists} />
    </section>
  );
};

export default ArtistList;

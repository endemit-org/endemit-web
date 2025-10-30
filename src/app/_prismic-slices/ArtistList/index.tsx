import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import ArtistListComponent from "@/app/_components/artist/ArtistList";

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

  let sortedArtists = artists;

  if (slice.primary.show === "Guests") {
    sortedArtists = sortedArtists.filter(artist => !artist.isEndemitCrew);
  }

  if (slice.primary.show === "Endemit") {
    sortedArtists = sortedArtists.filter(artist => artist.isEndemitCrew);
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <ArtistListComponent
        artists={sortedArtists}
        sortByName={true}
        title={slice.primary.title}
        description={slice.primary.description}
        includeFrame={slice.primary.render_frame}
      />
    </section>
  );
};

export default ArtistList;

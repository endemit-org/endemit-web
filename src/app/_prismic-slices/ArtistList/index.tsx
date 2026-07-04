import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import ArtistListComponent from "@/app/_components/artist/ArtistList";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `ArtistList`.
 */
export type ArtistListProps = SliceComponentProps<
  Content.ArtistListSlice,
  SliceContext
>;

/**
 * Component for "ArtistList" Slices.
 */
const ArtistList: FC<ArtistListProps> = async ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
  const artists = await fetchArtistsFromCms({});

  if (!artists || !artists.length) {
    return null;
  }

  let sortedArtists = artists.filter(artist => artist.showInArtistPage);

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
        title={pickLocalized(slice.primary, "title", locale)}
        description={pickLocalized(slice.primary, "description", locale)}
        includeFrame={slice.primary.render_frame}
      />
    </section>
  );
};

export default ArtistList;

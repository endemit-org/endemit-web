import { prismicClient } from "@/services/prismic";
import { PrismicArtistDocument } from "@/types/prismic";
import { getFormattedArtist } from "@/domain/artist/actions";

export const fetchArtistsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const artists = (await prismicClient.getAllByType("artist", {
    pageSize,
    ...(filters && { filters }),
  })) as PrismicArtistDocument[];

  const artistsWithLocalType = artists.map(event => getFormattedArtist(event));

  return artistsWithLocalType;
};

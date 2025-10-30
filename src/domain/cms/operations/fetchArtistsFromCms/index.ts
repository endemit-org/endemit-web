import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformArtistObject } from "@/domain/artist/transformers/transformArtistObject";

export const fetchArtistsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const artists = await prismicClient.getAllByType("artist", {
    pageSize,
    ...(filters && { filters }),
  });

  if (!artists) {
    return null;
  }

  const filteredOutB2b = artists.filter(artist => !artist.data.is_b2b);

  const transformedArtists = [];
  for (const artist of filteredOutB2b) {
    transformedArtists.push(await transformArtistObject(artist));
  }
  return transformedArtists;
};

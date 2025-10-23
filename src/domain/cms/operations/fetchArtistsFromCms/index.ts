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

  return artists.map(event => transformArtistObject(event));
};

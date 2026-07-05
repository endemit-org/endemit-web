import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformArtistObject } from "@/domain/artist/transformers/transformArtistObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchArtistsFromCms = async ({
  pageSize = 200,
  filters,
  locale = "sl",
}: {
  pageSize?: number;
  filters?: string[];
  locale?: AppLocale;
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
    transformedArtists.push(await transformArtistObject(artist, locale));
  }
  return transformedArtists;
};

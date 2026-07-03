import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformArtistObject } from "@/domain/artist/transformers/transformArtistObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchArtistFromCms = async (
  artistUid: string,
  locale: AppLocale = "sl"
) => {
  const prismicArtist = await prismicClient
    .getByUID("artist", artistUid)
    .catch(() => null);

  if (!prismicArtist) {
    return null;
  }

  return await transformArtistObject(prismicArtist, locale);
};

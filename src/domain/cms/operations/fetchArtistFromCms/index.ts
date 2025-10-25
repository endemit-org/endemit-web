import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformArtistObject } from "@/domain/artist/transformers/transformArtistObject";

export const fetchArtistFromCms = async (artistUid: string) => {
  const prismicArtist = await prismicClient
    .getByUID("artist", artistUid)
    .catch(() => null);

  if (!prismicArtist) {
    return null;
  }

  return transformArtistObject(prismicArtist);
};

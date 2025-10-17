import { prismicClient } from "@/services/prismic";
import { PrismicArtistDocument } from "@/domain/cms/types/prismic";
import { getFormattedArtist } from "@/domain/artist/actions";

export const fetchArtistFromCms = async (artistUid: string) => {
  const prismicArtist = (await prismicClient
    .getByUID("artist", artistUid)
    .catch(() => null)) as PrismicArtistDocument;

  if (!prismicArtist) {
    return null;
  }

  const artistWithLocalType = getFormattedArtist(prismicArtist);

  return artistWithLocalType;
};

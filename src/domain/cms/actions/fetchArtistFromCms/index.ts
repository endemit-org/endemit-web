import { prismicClient } from "@/app/services/prismic";
import { PrismicArtistDocument } from "@/types/prismic";
import { getFormattedArtist } from "@/domain/artist/actions";

export const fetchArtistFromCms = async (artistId: string) => {
  const prismicArtist = (await prismicClient
    .getByID(artistId)
    .catch(() => null)) as PrismicArtistDocument;

  const artistWithLocalType = getFormattedArtist(prismicArtist);

  return artistWithLocalType;
};

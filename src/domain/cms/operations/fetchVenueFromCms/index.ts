import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformVenueObject } from "@/domain/venue/transformers/transformVenueObject";

export const fetchVenueFromCms = async (venueUid: string) => {
  const prismicVenue = await prismicClient
    .getByUID("venue", venueUid)
    .catch(() => null);

  if (!prismicVenue) {
    return null;
  }

  return transformVenueObject(prismicVenue);
};

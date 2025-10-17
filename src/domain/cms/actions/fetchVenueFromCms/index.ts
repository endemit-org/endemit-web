import { prismicClient } from "@/services/prismic";
import { PrismicVenueDocument } from "@/domain/cms/types/prismic";
import { getFormattedVenue } from "@/domain/venue/actions";

export const fetchVenueFromCms = async (venueUid: string) => {
  const prismicVenue = (await prismicClient
    .getByUID("venue", venueUid)
    .catch(() => null)) as PrismicVenueDocument;

  if (!prismicVenue) {
    return null;
  }

  const venueWithLocalType = getFormattedVenue(prismicVenue);

  return venueWithLocalType;
};

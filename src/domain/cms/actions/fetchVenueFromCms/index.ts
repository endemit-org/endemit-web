import { prismicClient } from "@/services/prismic";
import { PrismicVenueDocument } from "@/types/prismic";
import { getFormattedVenue } from "@/domain/venue/actions";

export const fetchVenueFromCms = async (venueId: string) => {
  const prismicVenue = (await prismicClient
    .getByID(venueId)
    .catch(() => null)) as PrismicVenueDocument;

  const venueWithLocalType = getFormattedVenue(prismicVenue);

  return venueWithLocalType;
};

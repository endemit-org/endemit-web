import { prismicClient } from "@/services/prismic";
import { PrismicVenueDocument } from "@/domain/cms/types/prismic";
import { getFormattedVenue } from "@/domain/venue/actions";

export const fetchVenuesFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const venues = (await prismicClient.getAllByType("venue", {
    pageSize,
    ...(filters && { filters }),
  })) as PrismicVenueDocument[];

  if (!venues) {
    return null;
  }

  const venuesWithLocalType = venues.map(venue => getFormattedVenue(venue));

  return venuesWithLocalType;
};

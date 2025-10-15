import { prismicClient } from "@/services/prismic";
import { PrismicVenueDocument } from "@/types/prismic";
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

  const venuesWithLocalType = venues.map(venue => getFormattedVenue(venue));

  return venuesWithLocalType;
};

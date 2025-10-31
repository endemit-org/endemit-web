import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformVenueObject } from "@/domain/venue/transformers/transformVenueObject";

export const fetchVenuesFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const venues = await prismicClient.getAllByType("venue", {
    pageSize,
    ...(filters && { filters }),
  });

  const filteredVenue = venues.filter(venue => venue.data.show_in_venues);

  if (!filteredVenue) {
    return null;
  }

  const transformedVenues = [];
  for (const venue of filteredVenue) {
    transformedVenues.push(await transformVenueObject(venue));
  }
  return transformedVenues;
};

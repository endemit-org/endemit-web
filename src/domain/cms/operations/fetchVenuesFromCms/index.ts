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

  if (!venues) {
    return null;
  }

  const transformedVenues = [];
  for (const venue of venues) {
    transformedVenues.push(await transformVenueObject(venue));
  }
  return transformedVenues;
};

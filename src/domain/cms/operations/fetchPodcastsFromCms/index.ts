import "server-only";

import { prismicClient, prismic } from "@/lib/services/prismic";
import { transformPodcastObject } from "@/domain/podcast/transformers/transformPodcastObject";

export const fetchPodcastsFromCms = async ({
  pageSize = 200,
  filters,
  includeUnpublished = false,
}: {
  pageSize?: number;
  filters?: string[];
  includeUnpublished?: boolean;
}) => {
  // Build filters array, always filtering for published unless explicitly including unpublished
  const allFilters = [...(filters ?? [])];
  if (!includeUnpublished) {
    allFilters.push(prismic.filter.at("my.podcast.published", true));
  }

  const podcasts = await prismicClient.getAllByType("podcast", {
    pageSize,
    orderings: [
      {
        field: "my.podcast.episode_date",
        direction: "desc",
      },
    ],
    ...(allFilters.length > 0 && { filters: allFilters }),
  });

  if (!podcasts) {
    return null;
  }

  const transformedPodcasts = [];
  for (const podcast of podcasts) {
    transformedPodcasts.push(await transformPodcastObject(podcast));
  }
  return transformedPodcasts;
};

import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformPodcastObject } from "@/domain/podcast/transformers/transformPodcastObject";

export const fetchPodcastsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const podcasts = await prismicClient.getAllByType("podcast", {
    pageSize,
    orderings: [
      {
        field: "my.podcast.episode_date",
        direction: "desc",
      },
    ],
    ...(filters && { filters }),
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

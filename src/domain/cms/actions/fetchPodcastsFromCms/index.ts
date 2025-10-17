import { prismicClient } from "@/services/prismic";
import { PrismicPodcastDocument } from "@/domain/cms/types/prismic";
import { getFormattedPodcast } from "@/domain/podcast/actions";

export const fetchPodcastsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const podcasts = (await prismicClient.getAllByType("podcast", {
    pageSize,
    orderings: [
      {
        field: "my.podcast.episode_date",
        direction: "desc",
      },
    ],
    ...(filters && { filters }),
  })) as PrismicPodcastDocument[];

  if (!podcasts) {
    return null;
  }

  const podcastsWithLocalType = podcasts.map(podcast =>
    getFormattedPodcast(podcast)
  );

  return podcastsWithLocalType;
};

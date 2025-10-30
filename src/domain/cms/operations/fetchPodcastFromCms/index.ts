import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformPodcastObject } from "@/domain/podcast/transformers/transformPodcastObject";

export const fetchPodcastFromCms = async (podcastUid: string) => {
  const prismicPodcast = await prismicClient
    .getByUID("podcast", podcastUid)
    .catch(() => null);

  if (!prismicPodcast) {
    return null;
  }

  return await transformPodcastObject(prismicPodcast);
};

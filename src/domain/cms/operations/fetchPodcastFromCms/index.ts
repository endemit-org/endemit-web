import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformPodcastObject } from "@/domain/podcast/transformers/transformPodcastObject";
import type { AppLocale } from "@/i18n/routing";

export const fetchPodcastFromCms = async (
  podcastUid: string,
  options: { includeUnpublished?: boolean; locale?: AppLocale } = {}
) => {
  const { includeUnpublished = false, locale = "sl" } = options;

  const prismicPodcast = await prismicClient
    .getByUID("podcast", podcastUid)
    .catch(() => null);

  if (!prismicPodcast) {
    return null;
  }

  // If not including unpublished and podcast is not published, return null
  if (!includeUnpublished && !prismicPodcast.data.published) {
    return null;
  }

  return await transformPodcastObject(prismicPodcast, locale);
};

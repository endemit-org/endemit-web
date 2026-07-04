import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformPodcastObject } from "@/domain/podcast/transformers/transformPodcastObject";
import type { AppLocale } from "@/i18n/routing";

// The linked artist doc is embedded field-by-field — request its `_sl` twin so
// the podcast's artist bio localizes instead of falling back to English.
export const PODCAST_FETCH_LINKS = [
  "artist.name",
  "artist.description",
  "artist.description_sl",
  "artist.image",
  "artist.video",
  "artist.links",
];

export const fetchPodcastFromCms = async (
  podcastUid: string,
  options: { includeUnpublished?: boolean; locale?: AppLocale } = {}
) => {
  const { includeUnpublished = false, locale = "sl" } = options;

  const prismicPodcast = await prismicClient
    .getByUID("podcast", podcastUid, { fetchLinks: PODCAST_FETCH_LINKS })
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

import "server-only";

import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";
import type { AppLocale } from "@/i18n/routing";

export const fetchPodcastsForArtistFromCms = async (
  artistId: string,
  locale: AppLocale = "sl"
) => {
  const podcasts = await fetchPodcastsFromCms({ locale });

  if (!podcasts) {
    return null;
  }

  return podcasts.filter(podcast => podcast.artist?.id === artistId);
};

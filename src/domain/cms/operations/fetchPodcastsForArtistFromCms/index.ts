import "server-only";

import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";

export const fetchPodcastsForArtistFromCms = async (artistId: string) => {
  const podcasts = await fetchPodcastsFromCms({});

  if (!podcasts) {
    return null;
  }

  return podcasts.filter(podcast => podcast.artist?.id === artistId);
};

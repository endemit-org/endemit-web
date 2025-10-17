import { prismicClient } from "@/services/prismic";
import { PrismicPodcastDocument } from "@/domain/cms/types/prismic";
import { getFormattedPodcast } from "@/domain/podcast/actions";

export const fetchPodcastFromCms = async (podcastUid: string) => {
  const prismicPodcast = (await prismicClient
    .getByUID("podcast", podcastUid)
    .catch(() => null)) as PrismicPodcastDocument;

  if (!prismicPodcast) {
    return null;
  }

  const podcastWithLocalType = getFormattedPodcast(prismicPodcast);

  return podcastWithLocalType;
};

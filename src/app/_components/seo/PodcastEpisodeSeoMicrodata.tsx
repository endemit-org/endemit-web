import { Podcast } from "@/domain/podcast/types/podcast";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";

type Props = {
  podcast: Podcast;
};

export default function PodcastEpisodeSeoMicrodata({ podcast }: Props) {
  const episodeSchema = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: podcast.name,
    url: `${PUBLIC_BASE_WEB_URL}/music/emit/${podcast.uid}`,
    ...(podcast.date && { datePublished: podcast.date.toISOString() }),
    ...(podcast.cover?.src && { image: podcast.cover.src }),
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "EMIT Podcast",
      url: `${PUBLIC_BASE_WEB_URL}/music/emit`,
    },
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: podcast.track.url,
    },
  };

  return <SeoSchema>{episodeSchema}</SeoSchema>;
}

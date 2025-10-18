import { PrismicPodcastDocument } from "@/domain/cms/types/prismic";
import { richTextToPlainText } from "../../../../../lib/util";
import { Podcast } from "@/domain/podcast/types/podcast";

export const getFormattedPodcast = (podcast: PrismicPodcastDocument) => {
  return {
    id: podcast.id,
    uid: podcast.uid,
    name: podcast.data.episode_name,
    number: podcast.data.episode_number,
    date: podcast.data.episode_date
      ? new Date(podcast.data.episode_date)
      : null,
    description: podcast.data.description,
    cover: podcast.data.cover_image
      ? {
          src: podcast.data.cover_image.url,
          alt: podcast.data.cover_image.alt,
        }
      : null,

    track: {
      url: podcast.data.track_url,
      apiUrl: podcast.data.track_api_url,
    },
    artist: podcast.data.artist
      ? {
          id: podcast.data.artist.id,
          name: podcast.data.artist.data.name,
          description:
            richTextToPlainText(podcast.data.artist.data.description) || null,

          image: podcast.data.artist.data.image
            ? {
                src: podcast.data.artist.data.image.url,
                alt: podcast.data.artist.data.image.alt,
              }
            : null,
          video: podcast.data.artist.data.video?.url || null,
          links: podcast.data.artist.data.links
            ? podcast.data.artist.data.links.map(link => {
                return {
                  type: link.type,
                  url: link.link.url,
                };
              })
            : null,
        }
      : null,
    meta: {
      title: podcast.data.meta_title,
      description: podcast.data.meta_description,
      image: podcast.data.meta_image?.url || null,
    },
  } as Podcast;
};

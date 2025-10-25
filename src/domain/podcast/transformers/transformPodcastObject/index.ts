import { Podcast } from "@/domain/podcast/types/podcast";
import { asLink, isFilled } from "@prismicio/client";
import { PodcastDocument } from "@/prismicio-types";

const transformCoverImage = (
  coverImage: PodcastDocument["data"]["cover_image"]
) => {
  if (!isFilled.image(coverImage)) return null;
  return {
    src: coverImage.url,
    alt: coverImage.alt ?? "",
  };
};

const transformArtist = (artist: PodcastDocument["data"]["artist"]) => {
  const artistDoc = isFilled.contentRelationship(artist) ? artist : null;

  if (!artistDoc || !artistDoc.data) return null;

  return {
    id: artistDoc.id,
    name: artistDoc.data.name ?? "",
    description: artistDoc.data.description,
    image: {
      src: artistDoc.data.image.url ?? "",
      alt: artistDoc.data.image.alt ?? "",
    },
    video: asLink(artistDoc.data.video) ?? "",
    links: artistDoc.data.links.map(link => ({
      type: String(link.type),
      url: asLink(link.link) ?? "",
    })),
  };
};

export const transformPodcastObject = (podcast: PodcastDocument): Podcast => {
  return {
    id: podcast.id,
    uid: podcast.uid,
    name: podcast.data.episode_name ?? "",
    number: podcast.data.episode_number ?? "",
    date: podcast.data.episode_date
      ? new Date(podcast.data.episode_date)
      : null,
    description: podcast.data.description ?? "",
    cover: transformCoverImage(podcast.data.cover_image),
    track: {
      url: podcast.data.track_url ?? "",
      apiUrl: podcast.data.track_api_url ?? "",
    },
    artist: transformArtist(podcast.data.artist),
    meta: {
      title: podcast.data.meta_title,
      description: podcast.data.meta_description,
      image: podcast.data.meta_image?.url ?? null,
    },
  };
};

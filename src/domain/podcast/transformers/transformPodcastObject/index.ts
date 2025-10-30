import { Podcast } from "@/domain/podcast/types/podcast";
import { asLink, isFilled } from "@prismicio/client";
import { PodcastDocument } from "@/prismicio-types";
import { getBlurDataURL } from "@/lib/util/util";
import { CmsImage } from "@/domain/cms/types/common";

const transformCoverImage = async (
  coverImage: PodcastDocument["data"]["cover_image"]
) => {
  if (!isFilled.image(coverImage)) return null;
  return {
    src: coverImage.url,
    alt: coverImage.alt ?? "",
    placeholder: await getBlurDataURL(coverImage.url!),
  } as CmsImage;
};

const transformArtist = async (artist: PodcastDocument["data"]["artist"]) => {
  const artistDoc = isFilled.contentRelationship(artist) ? artist : null;

  if (!artistDoc || !artistDoc.data) return null;

  return {
    uid: artistDoc.uid!,
    id: artistDoc.id,
    name: artistDoc.data.name ?? "",
    description: artistDoc.data.description,
    image: {
      src: artistDoc.data.image.url ?? "",
      alt: artistDoc.data.image.alt ?? "",
      placeholder: await getBlurDataURL(artistDoc.data.image.url!),
    },
    video: asLink(artistDoc.data.video) ?? "",
    links: artistDoc.data.links.map(link => ({
      type: String(link.type),
      url: asLink(link.link) ?? "",
    })),
  };
};

export const transformPodcastObject = async (
  podcast: PodcastDocument
): Promise<Podcast> => {
  return {
    id: podcast.id,
    uid: podcast.uid,
    name: podcast.data.episode_name ?? "",
    number: podcast.data.episode_number ?? "",
    date: podcast.data.episode_date
      ? new Date(podcast.data.episode_date)
      : null,
    description: podcast.data.episode_description,
    footnote: podcast.data.footnote ?? "",
    cover: await transformCoverImage(podcast.data.cover_image),
    track: {
      url: podcast.data.track_url ?? "",
    },
    tracklist:
      podcast.data.tracklist && podcast.data.tracklist.length > 0
        ? podcast.data.tracklist.map(track => ({
            artist: String(track.artist),
            title: String(track.title),
            link: asLink(track.link),
            timestamp: track.timestamp ? String(track.timestamp) : undefined,
          }))
        : null,
    artist: await transformArtist(podcast.data.artist),
    updatedAt: new Date(podcast.last_publication_date),
    meta: {
      title: podcast.data.meta_title,
      description: podcast.data.meta_description,
      image: podcast.data.meta_image?.url ?? null,
    },
  };
};

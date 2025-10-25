import { Artist } from "@/domain/artist/types/artist";
import { ArtistDocument } from "@/prismicio-types";
import { asLink } from "@prismicio/client";

export const transformArtistObject = (artist: ArtistDocument) => {
  return {
    id: artist.id,
    uid: artist.uid,
    name: artist.data.name,
    description: artist.data.description,
    image: artist.data.image
      ? {
          src: artist.data.image.url,
          alt: artist.data.image.alt,
        }
      : null,
    video: asLink(artist.data.video) ?? null,
    links: artist.data.links
      ? artist.data.links.map(link => ({
          type: link.type,
          url: asLink(link.link),
        }))
      : [],

    meta: {
      title: artist.data.meta_title,
      description: artist.data.meta_description,
      image: artist.data.meta_image?.url || null,
    },
  } as Artist;
};

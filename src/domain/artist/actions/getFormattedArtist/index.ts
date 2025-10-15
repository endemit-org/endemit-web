import { PrismicArtistDocument } from "@/types/prismic";
import { richTextToPlainText } from "@/lib/util";
import { Artist } from "@/types/artist";

export const getFormattedArtist = (artist: PrismicArtistDocument) => {
  return {
    id: artist.id,
    uid: artist.uid,
    name: artist.data.name,
    description: richTextToPlainText(artist.data.description),
    image: artist.data.image
      ? {
          src: artist.data.image.url,
          alt: artist.data.image.alt,
        }
      : null,
    video: artist.data.video?.url ?? null,
    links: artist.data.links
      ? artist.data.links.map(link => ({
          type: link.type,
          url: link.link.url,
        }))
      : [],

    meta: {
      title: artist.data.meta_title,
      description: artist.data.meta_description,
      image: artist.data.meta_image?.url || null,
    },
  } as Artist;
};

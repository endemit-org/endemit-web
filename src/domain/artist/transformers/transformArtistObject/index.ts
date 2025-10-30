import { Artist } from "@/domain/artist/types/artist";
import { ArtistDocument } from "@/prismicio-types";
import { asLink, isFilled } from "@prismicio/client";
import { getBlurDataURL } from "@/lib/util/util";

export const transformArtistObject = async (artist: ArtistDocument) => {
  return {
    id: artist.id,
    uid: artist.uid,
    name: artist.data.name,
    description: artist.data.description,
    image: artist.data.image
      ? {
          src: artist.data.image.url,
          alt: artist.data.image.alt,
          placeholder: await getBlurDataURL(artist.data.image.url!),
        }
      : null,
    video: asLink(artist.data.video) ?? null,
    links: artist.data.links
      ? artist.data.links.map(link => ({
          type: link.type,
          url: asLink(link.link),
        }))
      : [],
    updatedAt: new Date(artist.last_publication_date),
    isEndemitCrew: artist.data.is_endemit_crew,
    isB2b: artist.data.is_b2b,
    b2bAttribution: artist.data.is_b2b
      ? artist.data.b2b_attributed_to_artist.map(artist => {
          if (!isFilled.contentRelationship(artist.artist)) return;

          return {
            name: artist.artist.data?.name,
            id: artist.artist.id,
            uid: artist.artist.uid,
          };
        })
      : null,
    meta: {
      title: artist.data.meta_title,
      description: artist.data.meta_description,
      image: artist.data.meta_image?.url || null,
    },
  } as Artist;
};

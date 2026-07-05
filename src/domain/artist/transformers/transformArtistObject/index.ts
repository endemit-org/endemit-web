import { Artist } from "@/domain/artist/types/artist";
import { ArtistDocument } from "@/prismicio-types";
import { asLink, isFilled } from "@prismicio/client";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformArtistObject = async (
  artist: ArtistDocument,
  locale: AppLocale = "sl"
) => {
  return {
    id: artist.id,
    uid: artist.uid,
    name: artist.data.name,
    description: pickLocalized(artist.data, "description", locale),
    image: artist.data.image
      ? {
          src: artist.data.image.url,
          alt: artist.data.image.alt,
          placeholder: await getBlurDataURL(artist.data.image.url!),
        }
      : null,
    video: asLink(artist.data.video) ?? null,
    links: artist.data.links
      ? artist.data.links
          .map(link => ({
            type: link.type,
            url: asLink(link.link),
          }))
          // Empty repeatable entries in Prismic come through as null type/url.
          .filter(link => link.type && link.url)
      : [],
    updatedAt: new Date(artist.last_publication_date),
    isEndemitCrew: artist.data.is_endemit_crew,
    showInArtistPage: artist.data.show_in_artist_page,
    isB2b: artist.data.is_b2b,
    b2bAttribution: artist.data.is_b2b
      ? artist.data.b2b_attributed_to_artist
          .map(artist => {
            if (!isFilled.contentRelationship(artist.artist)) return;

            return {
              name: artist.artist.data?.name,
              id: artist.artist.id,
              uid: artist.artist.uid,
            };
          })
          // Empty repeatable rows map to undefined — drop them.
          .filter(Boolean)
      : null,
    meta: {
      title: pickLocalized(artist.data, "meta_title", locale),
      description: pickLocalized(artist.data, "meta_description", locale),
      image: artist.data.meta_image?.url || null,
    },
    slices: artist.data.slices,
  } as Artist;
};

import { PrismicEventDocument } from "@/types/prismic";
import { Event } from "@/types/event";
import { richTextToPlainText } from "@/lib/util";

export const getFormattedEvent = (event: PrismicEventDocument) => {
  return {
    id: event.id,
    uid: event.uid,
    name: event.data.title,
    description: event.data.description
      ? richTextToPlainText(event.data.description)
      : null,
    coverImage: event.data.cover_image
      ? {
          src: event.data.cover_image.url,
          alt: event.data.cover_image.alt,
        }
      : null,
    promoImage: event.data.promo_image
      ? {
          src: event.data.promo_image.url,
          alt: event.data.promo_image.alt,
        }
      : null,

    venue: event.data.venue
      ? {
          id: event.data.venue.id,
          name: event.data.venue.data.name,
          address: event.data.venue.data.address,
          logo: event.data.venue.data.venue_logo
            ? {
                src: event.data.venue.data.venue_logo.url,
                alt: event.data.venue.data.venue_logo.alt,
              }
            : null,
        }
      : null,
    colour: event.data.colour,
    visibility: event.data.visibility,
    type: event.data.event_type,
    date_start: event.data.date_start ? new Date(event.data.date_start) : null,
    date_end: event.data.date_end ? new Date(event.data.date_end) : null,
    event: event.data.video?.url ?? null,
    artists:
      event.data.artists.length > 0
        ? event.data.artists
            .filter(artist => artist?.artist?.data.name)
            .map(artist => {
              return {
                id: artist.artist.id,
                name: artist.artist.data.name,
                description: artist.description_override
                  ? artist.description_override
                    ? richTextToPlainText(artist.description_override)
                    : null
                  : artist.artist.data.description
                    ? richTextToPlainText(artist.artist.data.description)
                    : null,
                image: artist.image_override
                  ? {
                      src: artist.image_override.url,
                      alt: artist.image_override.alt,
                    }
                  : {
                      src: artist.artist.data.image.url,
                      alt: artist.artist.data.image.alt,
                    },
                video:
                  artist.video_override?.url ?? artist.artist.data.video?.url,
                start_time: artist.start_time
                  ? new Date(artist.start_time)
                  : null,
                duration: artist.duration,
                stage: artist.stage,
                links: artist.artist.data.links
                  ? artist.artist.data.links.map(link => {
                      return {
                        type: link.type,
                        url: link.link.url,
                      };
                    })
                  : [],
              };
            })
        : [],
    meta: {
      title: event.data.meta_title,
      description: event.data.meta_description,
      image: event.data.meta_image?.url || null,
    },
  } as Event;
};

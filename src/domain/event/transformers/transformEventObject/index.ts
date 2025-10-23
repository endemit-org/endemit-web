import { Event } from "@/domain/event/types/event";

import { asLink, asText, isFilled } from "@prismicio/client";
import { EventDocument } from "@/prismicio-types";

export const transformEventObject = (
  event: EventDocument,
  ticketProductId: string | null
) => {
  const venueDoc = isFilled.contentRelationship(event.data.venue)
    ? event.data.venue
    : null;

  return {
    id: event.id,
    uid: event.uid,
    name: event.data.title,
    description: event.data.description ? asText(event.data.description) : null,
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
    slices: event.data.slices,

    venue:
      venueDoc && venueDoc.data
        ? {
            id: venueDoc.id,
            name: venueDoc.data.name,
            address: venueDoc.data.address,
            logo: venueDoc.data.venue_logo
              ? {
                  src: venueDoc.data.venue_logo.url,
                  alt: venueDoc.data.venue_logo.alt,
                }
              : null,
            mapLocationUrl: asLink(venueDoc.data.map_location_url),
          }
        : null,
    colour: event.data.colour,
    options: {
      visibility: event.data.visibility,
      enabledLink: event.data.enable_link_to_full_page,
    },
    tickets: {
      available: !!ticketProductId,
      productId: ticketProductId,
    },
    annotation: event.data.annotation,
    type: event.data.event_type,
    date_start: event.data.date_start ? new Date(event.data.date_start) : null,
    date_end: event.data.date_end ? new Date(event.data.date_end) : null,
    event: asLink(event.data.video) ?? null,
    artists:
      event.data.artists.length > 0
        ? event.data.artists
            .filter(item => isFilled.contentRelationship(item.artist))
            .map(item => {
              const artist = isFilled.contentRelationship(item.artist)
                ? item.artist
                : null;

              if (!artist || !artist.data) return null;

              return {
                id: artist.id,
                name: artist.data.name,
                description: item.description_override
                  ? asText(item.description_override)
                  : artist.data.description
                    ? asText(artist.data.description)
                    : null,
                image: item.image_override
                  ? {
                      src: item.image_override.url,
                      alt: item.image_override.alt,
                    }
                  : {
                      src: artist.data.image.url,
                      alt: artist.data.image.alt,
                    },
                video: asLink(item.video_override) ?? asLink(artist.data.video),
                start_time: item.start_time ? new Date(item.start_time) : null,
                duration: item.duration,
                stage: item.stage,
                links: artist.data.links
                  ? artist.data.links.map(link => ({
                      type: link.type,
                      url: asLink(link.link),
                    }))
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

//

import { Event } from "@/domain/event/types/event";

import { asLink, asText, isFilled } from "@prismicio/client";
import { EventDocument } from "@/prismicio-types";
import { convertMinutesToMs } from "@/lib/util/converters";
import { getBlurDataURL } from "@/lib/util/util";

export const transformEventObject = async (
  event: EventDocument,
  ticketProductId: string | null
) => {
  const venueDoc = isFilled.contentRelationship(event.data.venue)
    ? event.data.venue
    : null;

  const artists = [];
  if (event.data.artists.length > 0) {
    for (const item of event.data.artists) {
      if (!isFilled.contentRelationship(item.artist)) continue;

      const artist = item.artist;
      if (!artist || !artist.data) {
        artists.push(null);
        continue;
      }

      const imageUrl =
        item.image_override && item.image_override.url
          ? item.image_override.url
          : artist.data.image.url;

      const imageAlt =
        item.image_override && item.image_override.url
          ? item.image_override.alt
          : artist.data.image.alt;

      artists.push({
        id: artist.id,
        uid: artist.uid,
        name: item.name_override ?? artist.data.name,
        description:
          item.description_override.length > 0
            ? asText(item.description_override)
            : artist.data.description
              ? asText(artist.data.description)
              : null,
        image: {
          src: imageUrl,
          alt: imageAlt,
          placeholder: await getBlurDataURL(imageUrl!),
        },
        video: asLink(item.video_override) ?? asLink(artist.data.video),
        start_time: item.start_time ? new Date(item.start_time) : null,
        end_time:
          item.start_time && item.duration
            ? new Date(
                new Date(item.start_time).getTime() +
                  convertMinutesToMs(item.duration)
              )
            : null,
        duration: item.duration,
        stage: item.stage,
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
        links: artist.data.links
          ? artist.data.links.map(link => ({
              type: link.type,
              url: asLink(link.link),
            }))
          : [],
      });
    }
  }

  return {
    id: event.id,
    uid: event.uid,
    name: event.data.title,
    description: event.data.description ? asText(event.data.description) : null,
    coverImage: event.data.cover_image
      ? {
          src: event.data.cover_image.url,
          alt: event.data.cover_image.alt,
          placeholder: await getBlurDataURL(event.data.cover_image.url!),
        }
      : null,
    promoImage: event.data.promo_image
      ? {
          src: event.data.promo_image.url,
          alt: event.data.promo_image.alt,
          placeholder: await getBlurDataURL(event.data.promo_image.url!),
        }
      : null,
    video: asLink(event.data.video) ?? null,
    artAuthor: asLink(event.data.art_author)
      ? {
          text: event.data.art_author.text,
          link: asLink(event.data.art_author),
        }
      : null,
    slices: event.data.slices,

    venue:
      venueDoc && venueDoc.data
        ? {
            id: venueDoc.id,
            uid: venueDoc.uid,
            name: venueDoc.data.name,
            address: venueDoc.data.address,
            description: venueDoc.data.description,
            coordinates: venueDoc.data.coordinates,
            image: venueDoc.data.image
              ? {
                  src: venueDoc.data.image.url,
                  alt: venueDoc.data.image.alt,
                  placeholder: await getBlurDataURL(venueDoc.data.image.url!),
                }
              : null,
            logo: venueDoc.data.venue_logo
              ? {
                  src: venueDoc.data.venue_logo.url,
                  alt: venueDoc.data.venue_logo.alt,
                  placeholder: await getBlurDataURL(
                    venueDoc.data.venue_logo.url!
                  ),
                }
              : null,
            mapLocationUrl: asLink(venueDoc.data.map_location_url),
          }
        : null,
    colour: event.data.colour,
    options: {
      visibility: event.data.visibility,
      enabledLink: event.data.enable_link_to_full_page,
      enabledTicketScanning: event.data.allow_ticket_scanning,
      externalEventLink: event.data.external_event_link,
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
    artists,
    updatedAt: new Date(event.last_publication_date),
    meta: {
      title: event.data.meta_title,
      description: event.data.meta_description,
      image: event.data.meta_image?.url || null,
    },
  } as Event;
};

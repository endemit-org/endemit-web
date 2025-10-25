import { Venue } from "@/domain/venue/types/venue";
import { VenueDocument } from "@/prismicio-types";
import { asLink } from "@prismicio/client";

export const transformVenueObject = (venue: VenueDocument) => {
  return {
    id: venue.id,
    uid: venue.uid,
    name: venue.data.name,
    description: venue.data.description,
    image: venue.data.venue_logo
      ? {
          src: venue.data.venue_logo.url,
          alt: venue.data.venue_logo.alt,
        }
      : null,
    address: venue.data?.address ?? null,
    coordinates: venue.data.coordinates ?? null,
    mapUrl: asLink(venue.data.map_location_url) ?? null,
    meta: {
      title: venue.data.meta_title,
      description: venue.data.meta_description,
      image: venue.data.meta_image?.url || null,
    },
  } as Venue;
};

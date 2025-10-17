import { PrismicVenueDocument } from "@/domain/cms/types/prismic";
import { richTextToPlainText } from "@/lib/util";
import { Venue } from "@/domain/venue/types/venue";

export const getFormattedVenue = (venue: PrismicVenueDocument) => {
  return {
    id: venue.id,
    uid: venue.uid,
    name: venue.data.name,
    description: richTextToPlainText(venue.data.description),
    image: venue.data.venue_logo
      ? {
          src: venue.data.venue_logo.url,
          alt: venue.data.venue_logo.alt,
        }
      : null,
    address: venue.data?.address ?? null,
    mapUrl: venue.data.map_location_url.url ?? null,
    meta: {
      title: venue.data.meta_title,
      description: venue.data.meta_description,
      image: venue.data.meta_image?.url || null,
    },
  } as Venue;
};

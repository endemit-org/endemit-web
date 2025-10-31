import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";
import { Venue } from "@/domain/venue/types/venue";

type Props = {
  venue: Venue;
};

export default function VenueSeoMicrodata({ venue }: Props) {
  const venueSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: venue.name,
    ...(venue.description && { description: venue.description }),
    ...(venue.image?.src && { image: venue.image.src }),
    url: `${PUBLIC_BASE_WEB_URL}/venues/${venue.uid}`,
    ...(venue.address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: venue.address,
      },
    }),
    ...(venue.coordinates && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: venue.coordinates.latitude,
        longitude: venue.coordinates.longitude,
      },
    }),
    ...(venue.mapUrl && { hasMap: venue.mapUrl }),
  };

  return <SeoSchema>{venueSchema}</SeoSchema>;
}

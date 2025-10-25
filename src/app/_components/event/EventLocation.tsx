import { VenueInEvent } from "@/domain/event/types/event";
import GoogleMapLocation from "@/app/_components/content/GoogleMapLocation";

type Props = {
  venue: VenueInEvent | null;
};

export default function EventLocation({ venue }: Props) {
  if (!venue) return;

  return (
    <div>
      {venue?.coordinates && (
        <GoogleMapLocation
          center={{
            lat: venue?.coordinates.latitude,
            lng: venue?.coordinates.longitude,
          }}
          zoom={18}
          markers={[
            {
              position: {
                lat: venue?.coordinates.latitude,
                lng: venue?.coordinates.longitude,
              },
              customIcon: {
                url: "/images/endemit-icon-small.png", // Your custom icon URL
                scaledSize: { width: 40, height: 40 }, // Icon size
                anchor: { x: 20, y: 40 }, // Anchor point (usually bottom center)
              },
            },
          ]}
          mapOptions={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
          }}
        />
      )}
    </div>
  );
}

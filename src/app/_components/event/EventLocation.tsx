import { VenueInEvent } from "@/domain/event/types/event";
import GoogleMapLocation from "@/app/_components/content/GoogleMapLocation";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import Link from "next/link";

type Props = {
  venue: VenueInEvent | null;
};

function EventLocationDetails({ venue }: Props) {
  if (!venue) return;

  return (
    <>
      <div className={"mb-8"}>
        <RichTextDisplay richText={venue.description} />
      </div>
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
                url: "/images/endemit-icon-small.png",
                scaledSize: { width: 60, height: 60 },
                anchor: { x: 20, y: 40 },
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
    </>
  );
}

export default function EventLocation({ venue }: Props) {
  if (!venue) return;

  return (
    <div>
      <div className="flex gap-x-6">
        <div>
          <ImageWithFallback
            src={venue.logo?.src}
            alt={venue.logo?.alt ?? venue.name}
            className={"w-20"}
          />
        </div>

        <div className="flex gap-y-6 flex-col">
          <div>
            <h3 className={"text-4xl"}>{venue.name}</h3>
            <div>
              <Link
                className={"link"}
                href={venue.mapLocationUrl}
                target={"_blank"}
              >
                {venue.address}
              </Link>
            </div>
            <div className="max-lg:hidden">
              <EventLocationDetails venue={venue} />
            </div>
          </div>
        </div>
      </div>
      <div className="lg:hidden flex gap-y-6 flex-col mt-6">
        <EventLocationDetails venue={venue} />
      </div>
    </div>
  );
}

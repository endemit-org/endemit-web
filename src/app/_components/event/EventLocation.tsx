import { VenueInEvent } from "@/domain/event/types/event";
import GoogleMapLocation from "@/app/_components/content/GoogleMapLocation";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  venue: VenueInEvent | null;
  logoWidth?: "small" | "large";
};

function EventLocationDetails({ venue }: Props) {
  if (!venue) return;

  return (
    <>
      <ImageWithFallback
        src={venue.image?.src}
        alt={venue.image?.alt ?? venue.name}
        placeholder={venue.image?.placeholder}
        className={"w-full my-6"}
      />
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

export default function EventLocation({ venue, logoWidth = "small" }: Props) {
  if (!venue) return;

  return (
    <div>
      <div className="flex gap-x-6">
        <div>
          <ImageWithFallback
            src={venue.logo?.src}
            alt={venue.logo?.alt ?? venue.name}
            placeholder={venue.logo?.placeholder}
            className={clsx(
              "object-contain",
              logoWidth === "small" && "max-h-14 max-w-14 ",
              logoWidth === "large" && "max-h-28 max-w-28 "
            )}
          />
        </div>

        <div className="flex gap-y-6 flex-col">
          <div>
            <h3 className={"text-4xl"}>
              <Link
                className={"hover:opacity-90"}
                href={`/venues/${venue.uid}`}
                target={"_blank"}
              >
                {venue.name}
              </Link>
            </h3>
            <div className={"mb-6"}>
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

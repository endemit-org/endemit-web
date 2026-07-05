import dynamic from "next/dynamic";
import { VenueInEvent } from "@/domain/event/types/event";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import { Link } from "@/i18n/navigation";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";
import MapLoadingPlaceholder from "@/app/_components/content/MapLoadingPlaceholder";

// Dynamic import: Google Maps (~120KB) only loads when venue has coordinates
const GoogleMapLocation = dynamic(
  () => import("@/app/_components/content/GoogleMapLocation"),
  {
    loading: () => <MapLoadingPlaceholder />,
  }
);

type Props = {
  venue: VenueInEvent | null;
  logoWidth?: "small" | "large";
};

async function EventLocationDetails({ venue }: Props) {
  if (!venue) return;

  const t = await getTranslations("events");

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
        <div className="max-lg:hidden">
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
                url: "/images/navigation_pin.gif",
                scaledSize: { width: 65, height: 95 },
                anchor: { x: 32, y: 90 },
              },
            },
          ]}
            mapOptions={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: true,
            }}
          />
        </div>
      )}

      {venue.mapLocationUrl && (
        <div className={"text-center mt-6"}>
          <Link
            className={"link"}
            href={venue.mapLocationUrl}
            target={"_blank"}
          >
            {t("location.directions")}
          </Link>
        </div>
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
              {venue.mapLocationUrl ? (
                <Link
                  className={"link"}
                  href={venue.mapLocationUrl}
                  target={"_blank"}
                >
                  {venue.address}
                </Link>
              ) : (
                venue.address
              )}
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

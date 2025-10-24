import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import { formatDate } from "@/lib/util/formatting";
import { Event } from "@/domain/event/types/event";

export interface EventProps {
  event: Event;
}

export default function EventCard({ event }: EventProps) {
  const shouldShowLink = event.options.enabledLink;
  const shouldShowImage = !!event.coverImage?.src;
  const eventLink = `/events/${event.uid}`;

  return (
    <div
      className={clsx(
        "bg-neutral-950 p-2",
        !shouldShowLink && "cursor-not-allowed"
      )}
    >
      <Link
        href={shouldShowLink ? eventLink : ""}
        target={eventLink?.startsWith("http") ? "_blank" : "_self"}
        className={clsx(
          "block focus:outline-0 active:outline-0",
          !shouldShowLink && "pointer-events-none"
        )}
      >
        <div className={"relative"}>
          <div className="flex flex-col">
            {event.tickets.available && (
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-neutral-200 text-black animate-pulse text-sm flex w-fit gap-x-2 items-center">
                  <TicketIcon />
                  Tickets now available
                </span>
              </div>
            )}
            {shouldShowImage && event.promoImage?.src && (
              <Image
                src={event.promoImage?.src}
                alt={event.promoImage?.alt ?? event.name}
                width={400}
                height={400}
                className="object-cover aspect-square w-full"
              />
            )}
            {!shouldShowImage && (
              <div>
                <div
                  className="w-full aspect-square  flex items-center justify-center bg-stone-700 rounded-md  "
                  style={{
                    backgroundImage: "url('/images/worms.png')",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "color-burn",
                    backgroundSize: "40%",
                  }}
                >
                  <div className="text-center">
                    <Image
                      src={"/images/endemit-logo.png"}
                      alt={"Event image coming soon"}
                      width={48}
                      height={48}
                      className="mx-auto mb-2 opacity-70 "
                    />
                    <div className="text-stone-400 font-medium">
                      Details coming soon
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col justify-center my-6 px-6">
              <h3 className="text-xl md:text-7xl font-bold mb-2 text-neutral-200 uppercase">
                {event.name}
                {event.annotation && (
                  <span className="text-sm md:text-base font-normal text-gray-400 ml-2">
                    {event.annotation}
                  </span>
                )}
              </h3>
              {event.date_start && event.venue?.name && (
                <p className="text-gray-400 mb-3 text-sm">
                  {formatDate(event.date_start)} • {event.venue?.name}
                </p>
              )}
              {event.artists && event.artists.length > 0 && (
                <div className="text-md md:text-xl text-neutral-200 font-heading uppercase tracking-wider">
                  {event.artists.map(
                    (artist, index) => `${index > 0 ? " • " : ""}${artist.name}`
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

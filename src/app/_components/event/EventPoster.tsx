import Link from "next/link";
import clsx from "clsx";
import { formatEventDate } from "@/lib/util/formatting";
import { Event } from "@/domain/event/types/event";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import EventTicketAvailableStatus from "@/app/_components/event/EventTicketAvailableStatus";
import React from "react";
import { isEventCompleted } from "@/domain/event/businessLogic";
import EventPastEventStatus from "@/app/_components/event/EventPastEventStatus";

export interface EventProps {
  event: Event;
}

export default function EventPoster({ event }: EventProps) {
  const shouldShowLink =
    event.options.enabledLink || event.options.externalEventLink;
  const shouldShowImage = !!event.coverImage?.src;
  const eventLink = event.options.externalEventLink ?? `/events/${event.uid}`;
  const isPastEvent = isEventCompleted(event);

  return (
    <div
      className={clsx(
        "bg-neutral-950 p-2 group hover:bg-neutral-900",
        !shouldShowLink && "cursor-not-allowed"
      )}
    >
      <Link
        href={shouldShowLink ? eventLink : ""}
        target={eventLink?.startsWith("http") ? "_blank" : "_self"}
        className={clsx(
          "block focus:outline-0 active:outline-0 h-full",
          !shouldShowLink && "pointer-events-none"
        )}
      >
        <div className={"relative h-full"}>
          <div className=" h-full flex flex-col">
            <div className="relative aspect-square  w-full overflow-hidden">
              <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[20px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

              {event.tickets.available && (
                <EventTicketAvailableStatus
                  className={
                    "group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500"
                  }
                />
              )}

              {isPastEvent && (
                <EventPastEventStatus
                  className={
                    "group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500"
                  }
                />
              )}

              {shouldShowImage && event.promoImage?.src && (
                <ImageWithFallback
                  src={event.promoImage?.src}
                  alt={event.promoImage?.alt ?? event.name}
                  placeholder={event.promoImage?.placeholder}
                  width={600}
                  height={600}
                  quality={95}
                  className="object-cover aspect-square w-full group-hover:scale-125 group-hover:rotate-12 transition-all !duration-500 ease-out relative"
                />
              )}
              {!shouldShowImage && (
                <div
                  className="w-full aspect-square  flex items-center justify-center bg-neutral-700 rounded-md  group-hover:scale-125 transition-all duration-500 ease-out"
                  style={{
                    backgroundImage: "url('/images/worms.png')",
                    backgroundRepeat: "repeat",
                    backgroundBlendMode: "color-burn",
                    backgroundSize: "40%",
                  }}
                >
                  <div className="text-center">
                    <div className="w-20 text-neutral-200">
                      <EndemitLogo />
                    </div>
                    <div className="text-stone-400 font-medium">
                      Details coming soon
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center flex-1 my-6 px-6 @container">
              <h3 className=" font-bold mb-2  uppercase flex-1">
                <span className="text-neutral-200 text-[clamp(3rem,16cqi,20rem)] leading-tight">
                  {event.name}
                </span>

                {event.annotation && (
                  <span className="text-[clamp(1rem,5cqi,2rem)] font-normal text-gray-400 ml-2">
                    {event.annotation}
                  </span>
                )}
              </h3>
              {event.date_start && event.venue?.name && (
                <p
                  className={clsx(
                    "text-neutral-400 mb-3 text-[clamp(0.8rem,4cqi,1.3rem)]",
                    isPastEvent && "text-neutral-600"
                  )}
                >
                  {isPastEvent ? `Happened on ` : `Upcoming on `}
                  {event.date_start &&
                    event.date_end &&
                    formatEventDate(event.date_start, event.date_end)}
                  <br />
                  {event.venue?.name}
                </p>
              )}
              {event.artists && event.artists.length > 0 && (
                <div className="text-[clamp(1rem,6cqi,2rem)] text-neutral-200 font-heading uppercase tracking-wider">
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

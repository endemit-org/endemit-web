import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import { formatDate } from "@/lib/util/formatting";
import { Event } from "@/domain/event/types/event";
import { ReactNode } from "react";

export interface EventProps {
  event: Event;
  children?: ReactNode;
}

export default function EventCard({ event, children }: EventProps) {
  const shouldShowLink = event.options.enabledLink;
  const shouldShowImage = !!event.coverImage?.src;
  const eventLink = `/events/${event.uid}`;

  return (
    <div className={clsx(!shouldShowLink && "cursor-not-allowed")}>
      <Link
        href={shouldShowLink ? eventLink : ""}
        target={eventLink?.startsWith("http") ? "_blank" : "_self"}
        className={clsx(
          "block focus:outline-0 active:outline-0 mt-2 hover:scale-[1.02] transition-all duration-300 active:scale-[0.995]",
          !shouldShowLink && "pointer-events-none"
        )}
      >
        <div className={clsx("pt-4 pb-6 min-h-[220px] md:h-[220px]")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full">
            {shouldShowImage && event.coverImage?.src && (
              <div className="relative h-48 md:h-full overflow-hidden rounded-md aspect-[2/1]">
                <Image
                  src={event.coverImage?.src}
                  alt={event.coverImage?.alt ?? event.name}
                  fill
                  className="object-cover"
                />
                {children}
              </div>
            )}
            {!shouldShowImage && (
              <div>
                <div
                  className="w-full h-48 md:h-full flex items-center justify-center bg-stone-700 rounded-md  "
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
            <div className="flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-neutral-200 uppercase">
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
                <div className="text-md md:text-lg text-gray-400 font-heading">
                  {event.artists.map(
                    (artist, index) => `${index > 0 ? " • " : ""}${artist.name}`
                  )}
                </div>
              )}
              {event.tickets.available && (
                <div className="mt-4">
                  <span className="px-2 py-1 bg-neutral-200 text-black animate-pulse text-md rounded-md flex w-fit gap-x-2 items-center">
                    <TicketIcon />
                    Tickets now available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

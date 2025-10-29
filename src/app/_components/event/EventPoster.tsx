import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import { formatDate } from "@/lib/util/formatting";
import { Event } from "@/domain/event/types/event";

export interface EventProps {
  event: Event;
}

export default function EventPoster({ event }: EventProps) {
  const shouldShowLink = event.options.enabledLink;
  const shouldShowImage = !!event.coverImage?.src;
  const eventLink = `/events/${event.uid}`;

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
              {event.tickets.available && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2 py-1 bg-neutral-200 text-neutral-950 animate-pulse text-sm flex w-fit gap-x-2  uppercase font-bold">
                    <TicketIcon />
                    Tickets available
                  </span>
                </div>
              )}

              {shouldShowImage && event.promoImage?.src && (
                <Image
                  src={event.promoImage?.src}
                  alt={event.promoImage?.alt ?? event.name}
                  width={600}
                  height={600}
                  quality={95}
                  className="object-cover aspect-square w-full group-hover:scale-125 transition-transform duration-300 ease-in-out relative"
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
                <p className="text-gray-400 mb-3 text-[clamp(0.8rem,4cqi,1.3rem)]">
                  {formatDate(event.date_start)} • {event.venue?.name}
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

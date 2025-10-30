import { HTMLProps } from "react";
import clsx from "clsx";
import { formatDay, formatTime } from "@/lib/util/formatting";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import Link from "next/link";

interface ArtistCardProps {
  artist: ArtistAtEvent;
  cardClassName?: HTMLProps<HTMLElement>["className"];
  nameClassName?: HTMLProps<HTMLElement>["className"];
  descriptionClassName?: HTMLProps<HTMLElement>["className"];
  timeClassName?: HTMLProps<HTMLElement>["className"];
}

export default function ArtistEventCard({
  artist,
  cardClassName = "bg-neutral-900",
  nameClassName = "font-bold mb-4 text-neutral-200",
  descriptionClassName = "text-neutral-300 ",
  timeClassName = "text-neutral-200",
}: ArtistCardProps) {
  return (
    <div className={clsx("", cardClassName)}>
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        {/* Artist Photo */}
        <div className="lg:w-1/3 flex-shrink-0">
          <div className="relative w-full  overflow-hidden ">
            <ImageWithFallback
              src={artist.image?.src}
              alt={artist.image?.alt ?? artist.name}
              width={400}
              height={600}
              className="w-full h-auto"
              placeholder={artist.image?.placeholder}
            />
          </div>
          {/* Stage and Time Info */}
          {artist.start_time && artist.end_time && (
            <div className=" space-y-2 text-center  bg-neutral-950 p-2">
              <div
                className={clsx(
                  "max-sm:text-2xl lg:text-xl uppercase font-heading tracking-wide",
                  timeClassName
                )}
              >
                {formatDay(artist.start_time)} {formatTime(artist.start_time)} -{" "}
                {formatTime(artist.end_time)}
                {artist.stage && (
                  <div className={"mt-0.5 text-neutral-400"}>
                    @ {artist.stage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="lg:w-2/3 flex flex-col justify-center  max-lg:p-4">
          <div className="flex items-start justify-between">
            <h3
              className={clsx(
                "text-2xl lg:text-3xl mb-4 uppercase",
                nameClassName
              )}
            >
              {artist.name}
            </h3>
          </div>

          {artist.description && (
            <p
              className={clsx(
                "leading-relaxed text-sm lg:text-base",
                descriptionClassName
              )}
            >
              {String(artist.description)}
            </p>
          )}

          <Link className={"link mt-6"} href={`/artists/${artist.uid}`}>
            More about {artist.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

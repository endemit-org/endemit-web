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
  timeClassName = "font-bold text-neutral-400",
}: ArtistCardProps) {
  return (
    <div className={clsx("", cardClassName)}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Artist Photo */}
        <div className="lg:w-1/3 flex-shrink-0">
          <div className="relative w-full overflow-hidden ">
            <ImageWithFallback
              src={artist.image?.src}
              alt={artist.name}
              width={400}
              height={600}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        {/* Artist Info */}
        <div className="lg:w-2/3 flex flex-col justify-center">
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

          {/* Stage and Time Info */}
          {artist.start_time && artist.end_time && (
            <div className="mt-4 space-y-2">
              <div
                className={clsx("text-lg lg:text-xl uppercase", timeClassName)}
              >
                {formatDay(artist.start_time)} {formatTime(artist.start_time)} -{" "}
                {formatTime(artist.end_time)}
                {artist.stage && ` @ ${artist.stage}`}
              </div>
            </div>
          )}

          <Link className={"link mt-6"} href={`/artists/${artist.uid}`}>
            More about {artist.name}
          </Link>
        </div>
      </div>
    </div>
  );
}

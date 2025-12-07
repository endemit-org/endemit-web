import { HTMLProps } from "react";
import clsx from "clsx";
import { formatDay, formatTime } from "@/lib/util/formatting";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import Link from "next/link";
import Image from "next/image";
import { convertMonthsToMs } from "@/lib/util/converters";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";

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
  const isMoreThanThreeMonthsAgo = artist.start_time
    ? new Date(artist.start_time).getTime() < Date.now() - convertMonthsToMs(3)
    : false;

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
          {!isMoreThanThreeMonthsAgo &&
            artist.start_time &&
            artist.end_time && (
              <div className=" space-y-2 text-center  bg-neutral-950 p-2">
                <div
                  className={clsx(
                    "max-sm:text-2xl lg:text-xl uppercase font-heading tracking-wide",
                    timeClassName
                  )}
                >
                  {formatDay(artist.start_time)} {formatTime(artist.start_time)}{" "}
                  - {formatTime(artist.end_time)}
                  {artist.stage && (
                    <div className={"mt-0.5 text-neutral-400"}>
                      @ {artist.stage}
                    </div>
                  )}
                </div>
              </div>
            )}

          {artist.links.length > 0 && (
            <div className="flex gap-x-4 justify-center items-center">
              {artist.links.map(link => (
                <Link
                  href={link.url}
                  key={`${artist.id}-${link.type}`}
                  className={"hover:opacity-80"}
                  target={`_blank`}
                  title={`Listen to ${artist.name} on ${link.type}`}
                >
                  <Image
                    src={`/images/${link.type.toLowerCase().replace(" ", "")}.png`}
                    alt={`${artist.name} ${link.type}`}
                    width={40}
                    height={40}
                  />
                </Link>
              ))}
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
              <RichTextDisplay richText={artist.description} />
            </p>
          )}

          {!artist.isB2b && (
            <Link className={"link mt-6"} href={`/artists/${artist.uid}`}>
              More about {artist.name}
            </Link>
          )}

          {artist.isB2b && artist.b2bAttribution && (
            <div className={"flex gap-x-4"}>
              {artist.b2bAttribution.map(artist => (
                <Link
                  className={"link mt-6"}
                  href={`/artists/${artist.uid}`}
                  key={artist.uid}
                >
                  More about {artist.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

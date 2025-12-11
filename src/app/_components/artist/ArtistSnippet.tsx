import { getTimeUntil } from "@/lib/util/util";
import clsx from "clsx";
import { HTMLProps } from "react";
import { formatTime } from "@/lib/util/formatting";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";

interface ArtistSnippetProps {
  artist: ArtistAtEvent;
  isLive?: boolean;
  currentTime: Date;
  cardClassName?: HTMLProps<HTMLElement>["className"];
  liveCardClassName?: HTMLProps<HTMLElement>["className"];
  nameClassName?: HTMLProps<HTMLElement>["className"];
  descriptionClassName?: HTMLProps<HTMLElement>["className"];
}

export default function ArtistSnippet({
  artist,
  isLive = false,
  currentTime,
  cardClassName = "bg-neutral-200/80 border",
  liveCardClassName = "bg-purple-50",
  nameClassName = "font-bold text-black",
  descriptionClassName = "text-gray-600 ",
}: ArtistSnippetProps) {
  return (
    <div
      className={clsx(
        " rounded-lg p-4 select-none pointer-events-none shadow-md backdrop-blur-sm",
        isLive ? liveCardClassName : "",
        cardClassName
      )}
    >
      <div className="flex justify-between items-center gap-4">
        <ImageWithFallback
          src={artist.image?.src}
          placeholder={artist.image?.placeholder}
          alt={artist.name}
          width={100}
          height={100}
          className="rounded-lg"
        />
        <div className="flex-1">
          <h4 className={clsx("text-xl", nameClassName)}>{artist.name}</h4>
          <div className={clsx("text-lg ", descriptionClassName)}>
            {!isLive && artist.start_time && `${formatTime(artist.start_time)}`}
            {isLive && (
              <span className="animate-pulse text-red-600 flex gap-1 items-center">
                <span className="inline-block bg-red-600 rounded-full w-2 h-2 -mt-1"></span>
                LIVE NOW
              </span>
            )}
          </div>
          <div className={clsx(descriptionClassName)}>
            {!isLive &&
              artist.start_time &&
              getTimeUntil(currentTime, artist.start_time)}
            {artist.stage && <span>&nbsp;@ {artist.stage}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

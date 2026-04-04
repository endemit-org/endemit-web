"use client";

import Link from "next/link";
import { formatDate } from "@/lib/util/formatting";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import PlayIcon from "@/app/_components/icon/PlayIcon";
import { CmsImage } from "@/domain/cms/types/common";
import { usePlayerStore } from "@/app/_stores/PlayerStore";

interface PlayablePodcastCardProps {
  image?: CmsImage | null;
  name: string;
  date: Date | null;
  episodeNumber: string;
  uid: string;
  trackUrl: string;
  artist?: string;
}

export default function PlayablePodcastCard({
  uid,
  episodeNumber,
  date,
  name,
  image,
  trackUrl,
  artist,
}: PlayablePodcastCardProps) {
  const loadTrack = usePlayerStore(state => state.loadTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isCurrentlyPlaying = currentTrack?.url === trackUrl;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    loadTrack({
      url: trackUrl,
      title: `Emit ${episodeNumber}`,
      type: "episode",
      image: image?.src,
      artist,
    });
  };

  return (
    <div
      className={
        "group bg-neutral-950 p-2 hover:bg-neutral-900 rounded-sm text-left w-full"
      }
    >
      <Link href={`/music/emit/${uid}`}>
        <div className={"aspect-square overflow-hidden relative"}>
          <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

          {/* Play button overlay */}
          <button
            onClick={handlePlay}
            className={`absolute z-30 bottom-4 right-4 rounded-full bg-white/90 hover:bg-white hover:scale-110 flex items-center justify-center transition-all ${
              isCurrentlyPlaying
                ? "size-10 bg-white/40 animate-pulse"
                : "size-12"
            }`}
          >
            <PlayIcon
              className={`text-black ml-0.5 ${isCurrentlyPlaying ? "size-5" : "size-6"}`}
              fill
            />
          </button>

          {image && (
            <ImageWithFallback
              src={image.src}
              alt={image.alt ?? name}
              placeholder={image.placeholder}
              width={800}
              height={800}
              loading="lazy"
              className="aspect-square w-full object-cover xl:aspect-7/8 group-hover:scale-125 group-hover:rotate-12 transition-all !duration-500 ease-out"
            />
          )}
        </div>

        <div className={"flex my-4 w-full px-2"}>
          <div className={"flex-1"}>
            <h3 className="text-2xl text-neutral-200">{name}</h3>
            <p className="text-sm">
              <span className={"text-red-500"}>{episodeNumber}</span>
              {" • "}
              {date && (
                <span className={"text-neutral-200"}>{formatDate(date)}</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

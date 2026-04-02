"use client";

import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import PlayIcon from "@/app/_components/icon/PlayIcon";
import { CmsImage } from "@/domain/cms/types/common";
import { usePlayerStore } from "@/app/_stores/PlayerStore";

interface FeaturedPodcastCardProps {
  image?: CmsImage | null;
  name: string;
  episodeNumber: string;
  uid: string;
  trackUrl: string;
  artist?: string;
}

export default function FeaturedPodcastCard({
  uid,
  episodeNumber,
  name,
  image,
  trackUrl,
  artist,
}: FeaturedPodcastCardProps) {
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
    <div className="flex flex-col md:flex-row gap-6 md:gap-10 bg-neutral-950 p-4 md:p-6 rounded-lg">
      {/* Left: Tile image with play button */}
      <div className="relative w-full md:w-80 flex-shrink-0">
        <Link href={`/music/emit/${uid}`} className="block group">
          <div className="aspect-square overflow-hidden relative rounded-lg">
            <div className="absolute left-0 top-0 right-0 w-full bottom-0 border-[13px] z-20 border-neutral-100 scale-125 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />

            {/* Play button overlay */}
            <button
              onClick={handlePlay}
              className={`absolute z-30 bottom-4 right-4 rounded-full bg-white/90 hover:bg-white hover:scale-110 flex items-center justify-center transition-all ${
                isCurrentlyPlaying
                  ? "size-12 bg-white/40 animate-pulse"
                  : "size-14"
              }`}
            >
              <PlayIcon
                className={`text-black ml-0.5 ${isCurrentlyPlaying ? "size-6" : "size-7"}`}
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
                className="aspect-square w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            )}
          </div>
        </Link>
      </div>

      {/* Right: Episode details */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <div className="text-red-500 text-sm font-medium mb-2">
          Episode {episodeNumber}
        </div>

        <Link href={`/music/emit/${uid}`}>
          <h3 className="text-3xl md:text-4xl font-heading text-neutral-200 hover:text-white transition-colors mb-4">
            {name}
          </h3>
        </Link>

        {artist && (
          <div className="text-neutral-400 text-lg mb-6">
            <span className="text-neutral-500">by </span>
            {artist}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              isCurrentlyPlaying
                ? "bg-white/20 text-white"
                : "bg-white text-black hover:bg-neutral-200"
            }`}
          >
            <PlayIcon className="size-5" fill />
            {isCurrentlyPlaying ? "Playing" : "Play Episode"}
          </button>

          <Link
            href={`/music/emit/${uid}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-600 text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

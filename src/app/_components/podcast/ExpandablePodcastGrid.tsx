"use client";

import { useState } from "react";
import clsx from "clsx";
import { Podcast } from "@/domain/podcast/types/podcast";
import PlayablePodcastCard from "@/app/_components/podcast/PlayablePodcastCard";

interface Props {
  podcasts: Podcast[];
  initialCount?: number;
  gridCols?: "2" | "4";
}

export default function ExpandablePodcastGrid({
  podcasts,
  initialCount = 8,
  gridCols = "4",
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMore = podcasts.length > initialCount;
  const visiblePodcasts = isExpanded ? podcasts : podcasts.slice(0, initialCount);

  return (
    <>
      <div
        className={clsx(
          "grid gap-2 w-full",
          gridCols === "2"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        )}
      >
        {visiblePodcasts.map(podcast => (
          <PlayablePodcastCard
            key={podcast.id}
            uid={podcast.uid}
            name={podcast.name}
            episodeNumber={podcast.number}
            date={podcast.date}
            image={podcast.tile ?? podcast.cover}
            trackUrl={podcast.track.url}
            artist={podcast.artist?.name}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-neutral-200 text-sm transition-colors"
          >
            {isExpanded
              ? "Show less"
              : `View all ${podcasts.length} episodes`}
          </button>
        </div>
      )}
    </>
  );
}

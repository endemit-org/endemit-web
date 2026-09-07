"use client";

import { useState } from "react";
import { Podcast } from "@/domain/podcast/types/podcast";
import PlayablePodcastCard from "@/app/_components/podcast/PlayablePodcastCard";
import CardGrid from "@/app/_components/grid/CardGrid";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("music");
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMore = podcasts.length > initialCount;
  const visiblePodcasts = isExpanded
    ? podcasts
    : podcasts.slice(0, initialCount);

  return (
    <>
      {/* Orphans are only trimmed while collapsed — "view all" must show all. */}
      <CardGrid
        trimOrphans={!isExpanded}
        className={gridCols === "2" ? "!grid-cols-2" : undefined}
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
      </CardGrid>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-neutral-200 text-sm transition-colors"
          >
            {isExpanded
              ? t("showLess")
              : t("viewAll", { count: podcasts.length })}
          </button>
        </div>
      )}
    </>
  );
}

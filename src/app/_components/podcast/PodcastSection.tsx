"use client";

import { useState } from "react";
import clsx from "clsx";
import { Podcast } from "@/domain/podcast/types/podcast";
import PodcastCard from "@/app/_components/podcast/PodcastCard";

interface Props {
  podcasts: Podcast[];
  title?: string;
  description?: string;
  renderFrame?: boolean;
  initialCount?: number;
}

export default function PodcastSection({
  podcasts,
  title,
  description,
  renderFrame = true,
  initialCount = 8,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (podcasts.length === 0) {
    return;
  }

  const hasMore = podcasts.length > initialCount;
  const visiblePodcasts = isExpanded ? podcasts : podcasts.slice(0, initialCount);

  return (
    <section
      className={clsx(
        renderFrame && "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md",
        !renderFrame && "py-8"
      )}
    >
      {title && <h2 className={"text-3xl text-neutral-200"}>{title}</h2>}
      {description && (
        <p className={"text-md text-neutral-400"}>{description}</p>
      )}

      <div
        className={clsx(
          "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 w-full gap-2",
          title || description ? "mt-8" : "mt-0"
        )}
      >
        {visiblePodcasts.map(podcast => (
          <PodcastCard
            date={podcast.date}
            episodeNumber={podcast.number}
            key={podcast.id}
            image={podcast.tile ?? podcast.cover}
            name={podcast.name}
            uid={podcast.uid}
          />
        ))}
        {visiblePodcasts.length < 4 &&
          Array.from({ length: 4 - visiblePodcasts.length }).map((_, index) => (
            <div
              key={`filler-${index}`}
              className="bg-neutral-900 w-full h-full items-center justify-center hidden sm:flex xl:hidden 2xl:flex"
            >
              <div
                className={"text-neutral-700 font-heading uppercase text-lg "}
              >
                Coming soon
              </div>
            </div>
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
    </section>
  );
}

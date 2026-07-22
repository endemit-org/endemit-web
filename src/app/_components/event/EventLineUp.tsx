"use client";

import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";

import ArtistEventCard from "@/app/_components/artist/ArtistEventCard";
import { useEffect, useMemo, useState } from "react";
import { convertMonthsToMs } from "@/lib/util/converters";
import { useTranslations } from "next-intl";
import clsx from "clsx";

type Props = {
  artists: ArtistAtEvent[];
  showArtistTimes?: boolean;
};

type SortOption = "default" | "timestamp" | "alphabetical";

export default function EventLineUp({ artists, showArtistTimes = true }: Props) {
  const t = useTranslations("events");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const hasAnyTimes = useMemo(
    () => artists.some(a => a.start_time != null),
    [artists]
  );

  const sortedArtists = useMemo(() => {
    if (sortBy === "timestamp") {
      return [...artists].sort(
        (a, b) =>
          (a.start_time ? a.start_time.getTime() : 0) -
          (b.start_time ? b.start_time.getTime() : 0)
      );
    }
    if (sortBy === "alphabetical") {
      return [...artists].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "")
      );
    }
    return artists;
  }, [artists, sortBy]);

  const isMoreThanThreeMonthsAgo =
    artists.length > 0 && artists[0].start_time
      ? new Date(artists[0].start_time).getTime() <
        Date.now() - convertMonthsToMs(3)
      : false;

  const showSorter = hasAnyTimes && !isMoreThanThreeMonthsAgo;

  // For long lineups, swipe horizontally on mobile instead of a tall stack.
  const isBigLineup = sortedArtists.length > 5;

  // Deep-link support: /events/foo#artist-<uid> scrolls the lineup to that
  // card. Cards are the same DOM nodes on mobile and desktop, so one
  // scrollIntoView covers both the horizontal swiper (inline) and the
  // vertical stack (block).
  useEffect(() => {
    const scrollToHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash.startsWith("artist-")) return;
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    };
    // Give images/layout a beat to settle before measuring scroll targets.
    const timer = setTimeout(scrollToHash, 300);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return (
    <div className={"flex flex-col gap-y-6"}>
      <div className="flex gap-x-6 w-full items-center justify-between max-lg:flex-col">
        {sortedArtists.length > 0 && sortedArtists.length < 5 ? (
          <div
            className={
              "flex uppercase font-heading text-2xl gap-x-2 flex-1 max-lg:hidden"
            }
          >
            {sortedArtists.map(artist => (
              <div key={`mini-artist-mq-${artist.id}`}>{artist.name}</div>
            ))}
          </div>
        ) : (
          <div>{/* Right align spacer */}</div>
        )}
        {showSorter && (
          <div className="flex gap-x-6 items-center justify-end">
            <span className="text-sm font-medium">{t("lineup.sortBy")}</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-1 py-1 border border-neutral-700 rounded text-sm bg-neutral-600 text-neutral-300"
            >
              <option value="default">{t("lineup.sort.default")}</option>
              {showArtistTimes && (
                <option value="timestamp">
                  {t("lineup.sort.performanceTime")}
                </option>
              )}
              <option value="alphabetical">
                {t("lineup.sort.alphabetical")}
              </option>
            </select>
          </div>
        )}
      </div>
      <div
        className={clsx(
          "flex flex-col gap-6",
          isBigLineup &&
            "max-lg:flex-row max-lg:overflow-x-auto max-lg:snap-x max-lg:snap-mandatory max-lg:scrollbar-hide max-lg:-mx-4 max-lg:px-4 max-lg:pb-4"
        )}
      >
        {sortedArtists.map((artist: ArtistAtEvent) => (
          <div
            key={artist.id}
            id={`artist-${artist.uid}`}
            className={clsx(
              isBigLineup &&
                "max-lg:w-[85%] max-lg:flex-shrink-0 max-lg:snap-center"
            )}
          >
            <ArtistEventCard
              artist={artist}
              showTimes={showArtistTimes}
              sliderMode={isBigLineup}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

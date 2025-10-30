"use client";

import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";

import ArtistEventCard from "@/app/_components/artist/ArtistEventCard";
import { useMemo, useState } from "react";
import { convertMonthsToMs } from "@/lib/util/converters";

type Props = {
  artists: ArtistAtEvent[];
};

export default function EventLineUp({ artists }: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("default");

  type SortOption = "default" | "timestamp";

  const sortedArtists = useMemo(() => {
    if (sortBy === "timestamp") {
      return [...artists].sort(
        (a, b) =>
          (a.start_time ? a.start_time.getTime() : 0) -
          (b.start_time ? b.start_time.getTime() : 0)
      );
    }
    return artists;
  }, [artists, sortBy]);

  const isMoreThanThreeMonthsAgo =
    artists.length > 0 && artists[0].start_time
      ? new Date(artists[0].start_time).getTime() <
        Date.now() - convertMonthsToMs(3)
      : false;

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
        {!isMoreThanThreeMonthsAgo && (
          <div className="flex gap-x-6 items-center justify-end">
            <span className="text-sm font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-1 py-1 border border-gray-300 rounded text-sm bg-neutral-200 text-issun-boshi-purple"
            >
              <option value="default">Default</option>
              <option value="timestamp">Performance Time</option>
            </select>
          </div>
        )}
      </div>
      {sortedArtists.map((artist: ArtistAtEvent) => (
        <ArtistEventCard artist={artist} key={artist.id} />
      ))}{" "}
    </div>
  );
}

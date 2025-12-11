"use client";

import { useEffect, useState, useRef } from "react";
import ArtistSnippet from "@/app/_components/artist/ArtistSnippet";
import clsx from "clsx";
import { ArtistAtEvent } from "@/domain/artist/types/artistAtEvent";
import { formatDayName } from "@/lib/util/formatting";

interface ArtistCarouselProps {
  artists: ArtistAtEvent[];
  headline?: string;
  cardClassName?: string;
  liveCardClassName?: string;
  nameClassName?: string;
  descriptionClassName?: string;
  dayDividerClassName?: string;
}

type TimelineItem = {
  type: "artist" | "day-divider";
  artist?: ArtistAtEvent;
  day?: string;
  id: string;
};

export default function ArtistCarousel({
  artists,
  headline = "Set times",
  cardClassName,
  liveCardClassName,
  nameClassName,
  descriptionClassName,
  dayDividerClassName = "bg-gray-900 text-black bg-opacity-25 text-opacity-80",
}: ArtistCarouselProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const now = currentTime.getTime();

  if (!artists || artists.length === 0) {
    return null;
  }

  // Filter upcoming artists
  const upcomingArtists = artists
    .filter(a => a.start_time && a.end_time && a.end_time.getTime() > now)
    .sort((a, b) => a.start_time!.getTime() - b.start_time!.getTime());

  // Build timeline with day dividers
  const timelineItems: TimelineItem[] = [];
  let currentDay = "";

  upcomingArtists.forEach((artist, i) => {
    const day = formatDayName(artist.start_time!);

    if (day && day !== currentDay) {
      timelineItems.push({
        type: "day-divider",
        day,
        id: `day-${day}-${i}`,
      });
      currentDay = day;
    }

    timelineItems.push({
      type: "artist",
      artist,
      id: `artist-${artist.id || i}`,
    });
  });

  const isLive = (artist: ArtistAtEvent) =>
    now >= artist.start_time!.getTime() && now < artist.end_time!.getTime();

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;

    scrollRef.current.scrollLeft += e.deltaY;
  };

  if (timelineItems.length === 0) return null;

  return (
    <div className="w-full space-y-4 max-lg:mb-6">
      <h3 className="text-2xl font-bold uppercase">{headline}</h3>
      <div
        ref={scrollRef}
        className={clsx(
          "flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth select-none lg:pr-10",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x proximity",
          overscrollBehavior: "contain",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {timelineItems.map(item => {
          if (item.type === "day-divider") {
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex-shrink-0 flex items-center justify-center rounded-lg w-10",
                  dayDividerClassName
                )}
              >
                <div className="text-sm font-bold uppercase whitespace-nowrap rotate-90">
                  {item.day}
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="flex-shrink-0 min-w-[300px] max-w-[300px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <ArtistSnippet
                currentTime={currentTime}
                artist={item.artist!}
                isLive={isLive(item.artist!)}
                cardClassName={cardClassName}
                descriptionClassName={descriptionClassName}
                liveCardClassName={liveCardClassName}
                nameClassName={nameClassName}
              />
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

import EventPoster from "@/app/_components/event/EventPoster";
import React from "react";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted } from "@/domain/event/businessLogic";
import clsx from "clsx";
import EventSaveTheDateLister from "@/app/_components/event/EventSaveTheDateLister";
import { Event } from "@/domain/event/types/event";

type SaveTheDateItem = {
  title?: string;
  description?: string;
  date: Date;
  note?: string;
};

type ListItem =
  | { type: "event"; event: Event }
  | { type: "year"; year: number };

function buildEventListWithYearSeparators(events: Event[]): ListItem[] {
  const items: ListItem[] = [];
  let lastYear: number | null = null;

  for (const event of events) {
    const eventYear = event.date_start?.getFullYear() ?? null;

    // Add year separator when year changes (not for the first event)
    if (eventYear !== null && lastYear !== null && eventYear !== lastYear) {
      items.push({ type: "year", year: eventYear });
    }

    items.push({ type: "event", event });
    lastYear = eventYear;
  }

  return items;
}

function YearCard({ year }: { year: number }) {
  return (
    <div className="relative overflow-hidden bg-neutral-900 rounded-sm flex items-center justify-center max-md:py-16 border-neutral-950 ">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: "url('/images/noise.gif') no-repeat center center",
          backgroundSize: "200px",
          backgroundRepeat: "repeat",
        }}
      />
      <div className="text-neutral-700 font-heading text-6xl md:text-7xl lg:text-8xl">
        {year}
      </div>
    </div>
  );
}

interface EventListProps {
  title?: string;
  type: "Past" | "Upcoming" | "All";
  saveTheDateItems?: SaveTheDateItem[];
}

async function EventListContent({
  title,
  type,
  saveTheDateItems,
}: EventListProps) {
  const events = await fetchEventsFromCms({});

  if (!events) return null;

  let filteredEvents = events;

  if (type === "Upcoming") {
    filteredEvents = events
      .filter(event => !isEventCompleted(event))
      .filter(event => event.date_start !== null)
      //@ts-expect-error Typescript doesnt get that it cant be null
      .sort((a, b) => a.date_start - b.date_start);
  }

  if (type === "Past") {
    filteredEvents = events
      .filter(event => isEventCompleted(event))
      .filter(event => event.date_start !== null)
      //@ts-expect-error Typescript doesnt get that it cant be null
      .sort((a, b) => b.date_start - a.date_start);
  }

  const showSaveTheDate = saveTheDateItems && saveTheDateItems.length > 0;
  const showFiller =
    filteredEvents.length === 1 && type === "Upcoming" && !showSaveTheDate;

  if ((!filteredEvents || filteredEvents.length === 0) && !showSaveTheDate) {
    return [];
  }

  return (
    <>
      {title && (
        <h1 className="text-5xl lg:text-7xl font-bold text-neutral-200 mb-8 relative z-10">
          {title}
        </h1>
      )}
      <div
        className={clsx(
          "grid sm:grid-cols-2 gap-4 relative z-10",
          type === "Past" && "md:grid-cols-3"
        )}
      >
        {type === "Past"
          ? buildEventListWithYearSeparators(filteredEvents).map(
              (item, index) =>
                item.type === "year" ? (
                  <YearCard
                    key={`year-${item.year}-${index}`}
                    year={item.year}
                  />
                ) : (
                  <EventPoster
                    key={`${item.event.id}-${index}`}
                    event={item.event}
                  />
                )
            )
          : filteredEvents.map((event, index) => (
              <React.Fragment key={`${event.id}-${index}`}>
                <EventPoster event={event} />
              </React.Fragment>
            ))}
        {showSaveTheDate && (
          <EventSaveTheDateLister saveTheDateItems={saveTheDateItems} />
        )}
        {showFiller && (
          <div className={"max-sm:hidden relative overflow-hidden"}>
            <div
              className={" w-full h-full  flex justify-center items-center "}
            >
              <div
                className={"absolute inset-0 opacity-15"}
                style={{
                  background:
                    "url('/images/noise.gif') no-repeat center center",
                  backgroundSize: "200px",
                  backgroundRepeat: "repeat",
                }}
              ></div>
              <div
                className={
                  "text-neutral-400 font-heading text-2xl px-16 xl:px-36 text-center"
                }
              >
                More events will be announced soon
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Main component with Suspense boundary
export default function EventLister({
  title,
  type,
  saveTheDateItems,
}: EventListProps) {
  return (
    <EventListContent
      title={title}
      type={type}
      saveTheDateItems={saveTheDateItems}
    />
  );
}

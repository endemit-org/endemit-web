import EventPoster from "@/app/_components/event/EventPoster";
import React from "react";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted } from "@/domain/event/businessLogic";

interface EventListProps {
  title?: string;
  type: "Past" | "Upcoming" | "All";
}

async function EventListContent({ title, type }: EventListProps) {
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

  if (!filteredEvents || filteredEvents.length === 0) {
    return [];
  }

  return (
    <>
      {title && (
        <h1 className="text-3xl font-bold text-neutral-200 mb-8">{title}</h1>
      )}
      <div className={"grid sm:grid-cols-2 gap-4"}>
        {filteredEvents.map((event, index) => (
          <React.Fragment key={`${event.id}-${index}`}>
            <EventPoster event={event}>{/*{event.children}*/}</EventPoster>
          </React.Fragment>
        ))}
      </div>{" "}
    </>
  );
}

// Main component with Suspense boundary
export default function EventLister({ title, type }: EventListProps) {
  return <EventListContent title={title} type={type} />;
}

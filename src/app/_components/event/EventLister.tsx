import EventCard from "@/app/_components/event/EventCard";
import React, { Suspense } from "react";
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
    filteredEvents = events.filter(event => !isEventCompleted(event));
  }

  if (type === "Past") {
    filteredEvents = events.filter(event => isEventCompleted(event));
  }

  if (!filteredEvents || filteredEvents.length === 0) {
    return [];
  }

  return (
    <div>
      {title && (
        <h1 className="text-3xl font-bold text-neutral-200 mb-8">{title}</h1>
      )}
      {filteredEvents.map((event, index) => (
        <React.Fragment key={`${event.id}-${index}`}>
          {index > 0 && (
            <hr
              key={`divider-${index}`}
              className="border-t border-[#333333] my-4"
            />
          )}
          <EventCard event={event}>{/*{event.children}*/}</EventCard>
        </React.Fragment>
      ))}
    </div>
  );
}

// Main component with Suspense boundary
export default function EventLister({ title, type }: EventListProps) {
  return (
    <Suspense
      fallback={<div className="text-neutral-200">Loading events...</div>}
    >
      <EventListContent title={title} type={type} />
    </Suspense>
  );
}

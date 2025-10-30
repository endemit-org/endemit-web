import EventPoster from "@/app/_components/event/EventPoster";
import React from "react";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted } from "@/domain/event/businessLogic";
import clsx from "clsx";

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

  const showFiller = filteredEvents.length === 1 && type === "Upcoming";

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
        {filteredEvents.map((event, index) => (
          <React.Fragment key={`${event.id}-${index}`}>
            <EventPoster event={event}>{/*{event.children}*/}</EventPoster>
          </React.Fragment>
        ))}
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
export default function EventLister({ title, type }: EventListProps) {
  return <EventListContent title={title} type={type} />;
}

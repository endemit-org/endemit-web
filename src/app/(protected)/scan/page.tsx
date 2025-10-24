import PageHeadline from "@/app/_components/content/PageHeadline";
import OuterPage from "@/app/_components/content/OuterPage";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { prismic } from "@/lib/services/prismic";
import { isEventCompleted } from "@/domain/event/businessLogic";
import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { formatEventDateAndTime } from "@/lib/util/formatting";

export default async function AdminPage() {
  const eventsToScan = await fetchEventsFromCms({
    filters: [prismic.filter.at("my.event.allow_ticket_scanning", true)],
  });

  const eventsToDisplay = eventsToScan?.filter(event => {
    return !isEventCompleted(event);
  });

  return (
    <OuterPage>
      <PageHeadline
        title={"Ticket scanner"}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Scan", path: "scan" },
        ]}
      />
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Ticket scanner for events
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Welcome to the event ticket scanner. Select the event in the list
              below that you would like to scan the tickets for.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {eventsToDisplay &&
              eventsToDisplay.map(event => (
                <div
                  key={`event-card-scanner-${event.id}`}
                  className="border-t first:border-none border-gray-200 px-4 py-5 sm:px-6 flex gap-x-6"
                >
                  <ImageWithFallback
                    src={event.coverImage?.src}
                    alt={event.coverImage?.alt ?? ""}
                    width={100}
                    height={100}
                    className={"aspect-square object-fill w-20"}
                  />

                  <Link
                    key={event.id}
                    href={`/scan/${event.uid}`}
                    className="text-2xl"
                  >
                    {event.name}
                    {event.date_start && (
                      <span className={"block text-sm"}>
                        {formatEventDateAndTime(event.date_start)}
                      </span>
                    )}
                  </Link>
                </div>
              ))}

            {!eventsToDisplay ||
              (eventsToDisplay.length === 0 && (
                <div>There are no events to scan right now</div>
              ))}
          </div>
        </div>
      </div>
    </OuterPage>
  );
}

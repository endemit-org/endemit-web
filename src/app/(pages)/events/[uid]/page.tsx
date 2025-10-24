import PageHeadline from "@/app/_components/content/PageHeadline";
import InnerPage from "@/app/_components/content/InnerPage";
import OuterPage from "@/app/_components/content/OuterPage";
import { notFound } from "next/navigation";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import Image from "next/image";
import Tabs, { TabItem } from "@/app/_components/content/Tabs";
import { fetchInnerContentPagesForEvent } from "@/domain/cms/operations/fetchInnerContentPagesFromCms";
import SliceDisplay from "@/app/_components/content/SliceDisplay";

export async function generateStaticParams() {
  const events = await fetchEventsFromCms({});

  if (!events || events.length === 0) {
    return [];
  }

  return events.map(event => ({
    uid: event.uid,
  }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const event = await fetchEventFromCmsByUid(uid);

  if (!event) {
    notFound();
  }

  const innerContentPages = await fetchInnerContentPagesForEvent(event.id);

  const defaultContent = [
    { label: "Lineup", content: "test 1", id: "page", sortingWeight: 200 },
    { label: "Location", content: "test 2", id: "page2", sortingWeight: 300 },
    { label: "Tickets", content: "test 3", id: "page3", sortingWeight: 400 },
  ] as TabItem[];

  if (innerContentPages && innerContentPages?.length > 0) {
    innerContentPages.forEach(page => {
      defaultContent.push({
        label: page.title,
        content: <SliceDisplay slices={page.slices} />,
        id: page.uid,
        sortingWeight: page.sortingWeight,
      });
    });
  }

  if (event.slices.length > 0) {
    defaultContent.push({
      label: "Overview",
      content: <SliceDisplay slices={event.slices} />,
      id: "overview",
      sortingWeight: 0,
    });
  }

  return (
    <OuterPage>
      <PageHeadline
        title={event.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Events", path: "events" },
          { label: event.name, path: event.uid },
        ]}
      />

      <InnerPage>
        {/*<EventList*/}
        {/*  title="UPCOMING EVENTS"*/}
        {/*  events={events.filter(event => !isEventCompleted(event))}*/}
        {/*/>*/}
        {/*<EventList*/}
        {/*  title="PAST EVENTS"*/}
        {/*  events={events.filter(event => isEventCompleted(event))}*/}
        {/*/>*/}

        <div
          className={"absolute h-96 -top-1 blur-3xl -left-10 -right-10"}
          style={{
            backgroundImage: `url(${event.coverImage?.src})`,
          }}
        ></div>
        <div
          className={"absolute h-5 -top-1 -left-10 -right-10"}
          style={{
            backgroundColor: event.colour,
          }}
        ></div>
        <div className={"relative"}>
          <div>
            {event.coverImage?.src && (
              <Image
                src={event.coverImage?.src}
                alt={event.coverImage?.alt ?? ""}
                height={500}
                width={888}
                className="aspect-video"
              />
            )}
          </div>

          <Tabs items={defaultContent} sortByWeight={true} />
        </div>
      </InnerPage>
    </OuterPage>
  );
}

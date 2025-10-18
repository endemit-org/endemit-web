import events from "@/config/events.config";
import EventList from "@/components/event/EventList";
import EndemitSubscribe from "@/components/newsletter/EndemitSubscribe";
import type { Metadata } from "next";
import PageHeadline from "@/components/content/PageHeadline";
import InnerPage from "@/components/content/InnerPage";
import OuterPage from "@/components/content/OuterPage";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Endemit events are rare moments when these inner worlds surface, shaped with care, emotion, and intent. No two are the same, but all come from the same place.",
  openGraph: {
    images: ["/images/og/endemit-og.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function EventsPage() {
  return (
    <OuterPage>
      <PageHeadline
        title={"Events"}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Events", path: "events" },
        ]}
      />

      <InnerPage>
        <EventList
          title="UPCOMING EVENTS"
          events={events.filter(event => !event.options?.isPastEvent)}
        />
        <EventList
          title="PAST EVENTS"
          events={events.filter(event => event.options?.isPastEvent)}
        />
        <EndemitSubscribe />
      </InnerPage>
    </OuterPage>
  );
}

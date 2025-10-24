import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import EventLister from "@/app/_components/event/EventLister";

/**
 * Props for `EventList`.
 */
export type EventListProps = SliceComponentProps<Content.EventListSlice>;

/**
 * Component for "EventList" Slices.
 */
const EventList: FC<EventListProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <EventLister
        type={slice.primary.show ?? "All"}
        title={slice.primary.title ?? undefined}
      />
    </section>
  );
};

export default EventList;

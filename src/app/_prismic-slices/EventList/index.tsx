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
  const show = slice.variation === "default" ? "Upcoming" : "Past";
  const saveTheDateItems =
    slice.variation === "default" ? slice.primary.save_the_date : undefined;

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <EventLister
        type={show}
        title={slice.primary.title ?? undefined}
        saveTheDateItems={
          saveTheDateItems
            ? saveTheDateItems.map(item => ({
                title: item.title ?? undefined,
                date: item.date ? new Date(item.date) : new Date(),
                description: item.description ?? undefined,
                note: item.note ?? undefined,
              }))
            : undefined
        }
      />
    </section>
  );
};

export default EventList;

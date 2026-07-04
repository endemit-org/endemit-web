import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import EventLister from "@/app/_components/event/EventLister";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `EventList`.
 */
export type EventListProps = SliceComponentProps<
  Content.EventListSlice,
  SliceContext
>;

/**
 * Component for "EventList" Slices.
 */
const EventList: FC<EventListProps> = ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
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
        title={pickLocalized(slice.primary, "title", locale) ?? undefined}
        saveTheDateItems={
          saveTheDateItems
            ? saveTheDateItems.map(item => ({
                title: item.title ?? undefined,
                date: item.date ? new Date(item.date) : new Date(),
                description:
                  pickLocalized(item, "description", locale) ?? undefined,
                note: pickLocalized(item, "note", locale) ?? undefined,
              }))
            : undefined
        }
      />
    </section>
  );
};

export default EventList;

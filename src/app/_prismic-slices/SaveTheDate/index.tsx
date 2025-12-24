import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import EventSaveTheDateLister from "@/app/_components/event/EventSaveTheDateLister";

/**
 * Props for `SaveTheDate`.
 */
export type SaveTheDateProps = SliceComponentProps<Content.SaveTheDateSlice>;

/**
 * Component for "SaveTheDate" Slices.
 */
const SaveTheDate: FC<SaveTheDateProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {slice.primary.save_the_date &&
        slice.primary.save_the_date.length > 0 && (
          <EventSaveTheDateLister
            saveTheDateItems={
              slice.primary.save_the_date
                ? slice.primary.save_the_date.map(item => ({
                    title: item.title ?? undefined,
                    date: item.date ? new Date(item.date) : new Date(),
                    description: item.description ?? undefined,
                    note: item.note ?? undefined,
                  }))
                : undefined
            }
          />
        )}
    </section>
  );
};

export default SaveTheDate;

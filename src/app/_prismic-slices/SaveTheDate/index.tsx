import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import EventSaveTheDateLister from "@/app/_components/event/EventSaveTheDateLister";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { SliceContext } from "@/app/_components/content/SliceDisplay";

/**
 * Props for `SaveTheDate`.
 */
export type SaveTheDateProps = SliceComponentProps<
  Content.SaveTheDateSlice,
  SliceContext
>;

/**
 * Component for "SaveTheDate" Slices.
 */
const SaveTheDate: FC<SaveTheDateProps> = ({ slice, context }) => {
  const locale = context?.locale ?? "sl";
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
                    description:
                      pickLocalized(item, "description", locale) ?? undefined,
                    note: pickLocalized(item, "note", locale) ?? undefined,
                  }))
                : undefined
            }
          />
        )}
    </section>
  );
};

export default SaveTheDate;

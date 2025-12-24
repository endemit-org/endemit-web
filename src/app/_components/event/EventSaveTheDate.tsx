import React from "react";
import { formatDayOfMonth, formatMonthNameShort } from "@/lib/util/formatting";
import clsx from "clsx";

export interface SaveTheDateProps {
  saveTheDateItem: {
    title?: string;
    description?: string;
    date: Date;
    note?: string;
  };
}

export default function EventSaveTheDate({
  saveTheDateItem,
}: SaveTheDateProps) {
  const date = new Date(saveTheDateItem.date);
  const monthNameShort = formatMonthNameShort(date);
  const dayOfMonth = formatDayOfMonth(date);
  return (
    <div className="flex-1 flex w-full gap-x-4 cursor-not-allowed">
      <div
        className={
          "uppercase bg-neutral-200 text-neutral-900 p-4 text-center  w-32 min-w-32 h-32 font-heading text-2xl rounded-b-lg border-t-8 border-t-neutral-300"
        }
      >
        <div className={"text-6xl"}>{dayOfMonth}</div>
        {monthNameShort}
      </div>
      <div className={"pt-6"}>
        <div
          className={clsx(
            "text-4xl uppercase font-heading text-neutral-200",
            !saveTheDateItem.title && "blur-md select-none scale-y-75"
          )}
        >
          {saveTheDateItem.title ?? "Nice try, it's a secret!"}
        </div>
        {saveTheDateItem.description && (
          <div className="text-neutral-300">{saveTheDateItem.description}</div>
        )}
        {saveTheDateItem.note && (
          <div className="text-neutral-400 text-md">{saveTheDateItem.note}</div>
        )}
      </div>
    </div>
  );
}

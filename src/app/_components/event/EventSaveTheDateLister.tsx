import EventSaveTheDate from "@/app/_components/event/EventSaveTheDate";
import React from "react";

type SaveTheDateItem = {
  title?: string;
  description?: string;
  date: Date;
  note?: string;
};

export default function EventSaveTheDateLister({
  saveTheDateItems,
}: {
  saveTheDateItems?: SaveTheDateItem[];
}) {
  return (
    <div className={"relative overflow-hidden border-8 border-neutral-950"}>
      <div className={" w-full h-full   "}>
        <div
          className={"absolute inset-0 opacity-15"}
          style={{
            background: "url('/images/noise.gif') no-repeat center center",
            backgroundSize: "200px",
            backgroundRepeat: "repeat",
          }}
        ></div>
        <div
          className={"flex flex-col w-full h-full p-4 relative z-10 gap-y-6"}
        >
          <div
            className={
              "font-heading text-5xl font-black text-neutral-200 uppercase "
            }
          >
            Save the date
            {saveTheDateItems && saveTheDateItems?.length > 1 && "s"}
          </div>
          <div className={" flex flex-col w-full gap-y-8 lg:gap-y-4 "}>
            {saveTheDateItems?.map(item => {
              return (
                <EventSaveTheDate
                  key={`${item.title}-${item.date}`}
                  saveTheDateItem={item}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

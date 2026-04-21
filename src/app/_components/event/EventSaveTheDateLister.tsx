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
    <div
      className={
        "relative overflow-hidden border-8 border-neutral-950 @container "
      }
    >
      <div className={" w-full h-full max-sm:py-10"}>
        <div
          className={"absolute inset-0 opacity-15"}
          style={{
            background: "url('/images/noise.gif') no-repeat center center",
            backgroundSize: "200px",
            backgroundRepeat: "repeat",
          }}
        ></div>
        <div className="w-full h-full absolute object-fill overflow-hidden opacity-40 top-0 ">
          <video
            src={"/images/dancing_bck.webm"}
            loop={true}
            muted={true}
            autoPlay={true}
            playsInline={true}
            className={"w-full h-full object-cover"}
          />
        </div>
        <div
          className={"flex flex-col w-full h-full p-4 relative z-10 gap-y-6"}
        >
          <div
            className={
              "font-heading text-5xl font-black text-neutral-200 uppercase text-center @md:text-left @2xl:text-center"
            }
          >
            Save the date
            {saveTheDateItems && saveTheDateItems?.length > 1 && "s"}
          </div>
          <div
            className={
              " flex flex-col w-full gap-y-8 lg:gap-y-4 @2xl:grid @2xl:grid-cols-2 @2xl:gap-x-4"
            }
          >
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

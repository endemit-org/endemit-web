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
import { formatDate } from "@/lib/util/formatting";
import EventLineUp from "@/app/_components/event/EventLineUp";
import EventLocation from "@/app/_components/event/EventLocation";
import Link from "next/link";

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
    {
      label: "Lineup",
      content: <EventLineUp artists={event.artists} />,
      id: "page",
      sortingWeight: 200,
    },
    {
      label: "Location",
      id: "test-2",
      content: <EventLocation venue={event.venue} />,
      sortingWeight: 300,
    },
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
      <div
        className={
          "absolute top-80 h-96 blur-2xl -left-10 -right-10 bg-cover animate-blurred-backdrop @container"
        }
        style={{
          backgroundImage: `url(${event.coverImage?.src})`,
        }}
      ></div>
      <div
        style={{
          backgroundImage: "url('/images/worms.png')",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "soft-light",
          backgroundSize: "150px",
        }}
        className={"bg-neutral-950 relative"}
      >
        <div className={"flex justify-center relative max-lg:flex-col"}>
          {event.artAuthor && (
            <Link
              href={event.artAuthor.link}
              target={"_blank"}
              className={
                "absolute  left-0 bottom-0 bg-neutral-900 py-2 px-2 text-xs text-neutral-600"
              }
            >
              Author: {event.artAuthor.text}
            </Link>
          )}
          {event.coverImage?.src && (
            <Image
              src={event.coverImage?.src}
              alt={event.coverImage?.alt ?? ""}
              height={500}
              width={888}
              className="aspect-video lg:w-2/3 w-full"
            />
          )}
          <div
            className={
              "lg:w-1/3  text-neutral-200 p-2 lg:p-4 xl:p-8 border-l-2 border-l-neutral-200 flex flex-col"
            }
          >
            {/*<h1 className={"lg:text-4xl xl:text-5xl 8xl:text-6xl"}>*/}
            {/*  {event.name}*/}
            {/*</h1>*/}
            {event.date_start && (
              <div className={"uppercase "}>{formatDate(event.date_start)}</div>
            )}

            <div className="flex-1 justify-center flex flex-col">
              {event.artists.map(artist => (
                <h3
                  className={"lg:text-3xl xl:text-4xl px-3"}
                  key={`artist-marquee-${artist.id}`}
                >
                  {artist.name}
                </h3>
              ))}
            </div>
            <div className={"flex gap-x-2 text-sm lg:text-md"}>
              {event.venue?.logo && event.venue?.logo.src && (
                <Image
                  src={event.venue?.logo.src}
                  alt={event.venue?.logo.src}
                  width={20}
                  height={20}
                  className="aspect-square w-6 h-6"
                />
              )}
              {event.venue?.name}
            </div>
          </div>
        </div>
      </div>

      <div
        className={
          "text-[clamp(4rem,4cqi,20rem)] leading-[clamp(4rem,4cqi,20rem)] relative text-neutral-950 uppercase font-heading flex text-center w-full justify-between overflow-hidden text-nowrap -scale-y-100"
        }
      >
        {event.name} · {event.name} · {event.name} · {event.name} · {event.name}{" "}
        · {event.name} · {event.name} · {event.name} ·
      </div>
      {/*<div*/}
      {/*  className={"absolute h-5 -top-1 -left-10 -right-10"}*/}
      {/*  style={{*/}
      {/*    backgroundColor: event.colour,*/}
      {/*  }}*/}
      {/*></div>*/}
      <div className={"relative"}>
        {" "}
        <Tabs items={defaultContent} sortByWeight={true} />
        <div className={"flex justify-center"}></div>
      </div>

      <InnerPage> a</InnerPage>
    </OuterPage>
  );
}

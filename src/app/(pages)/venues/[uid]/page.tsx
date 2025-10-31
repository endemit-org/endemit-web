import PageHeadline from "@/app/_components/ui/PageHeadline";
import InnerPage from "@/app/_components/ui/InnerPage";
import OuterPage from "@/app/_components/ui/OuterPage";
import { notFound } from "next/navigation";
import Spacer from "@/app/_components/content/Spacer";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import clsx from "clsx";
import EventMiniCard from "@/app/_components/event/EventMiniCard";
import { Metadata } from "next";
import { prismic } from "@/lib/services/prismic";
import { getResizedPrismicImage } from "@/lib/util/util";
import { fetchVenuesFromCms } from "@/domain/cms/operations/fetchVenuesFromCms";
import { fetchVenueFromCms } from "@/domain/cms/operations/fetchVenueFromCms";
import { fetchEventsForVenueFromCms } from "@/domain/cms/operations/fetchEventsForVenueFromCms";
import EventLocation from "@/app/_components/event/EventLocation";

export async function generateStaticParams() {
  const venues = await fetchVenuesFromCms({});

  if (!venues || venues.length === 0) {
    return [];
  }

  return venues.map(venue => ({
    uid: venue.uid,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}): Promise<Metadata> {
  const { uid } = await params;
  const venue = await fetchVenueFromCms(uid);

  if (!venue) {
    notFound();
  }

  const title = `${venue.meta.title ?? venue.name} • Venues`;
  const description =
    venue?.meta.description ?? prismic.asText(venue.description) ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: venue.meta.image
        ? [venue.meta.image]
        : venue.image?.src
          ? [venue.image?.src]
          : undefined,
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const venue = await fetchVenueFromCms(uid);

  if (!venue || !venue.showOnVenuePage) {
    notFound();
  }

  const relatedEventsQuery = await fetchEventsForVenueFromCms(venue.id);

  const relatedEvents = relatedEventsQuery
    ? relatedEventsQuery.sort((a, b) => {
        if (!a.date_start || !b.date_start) return 0;
        return b.date_start.getTime() - a.date_start.getTime();
      })
    : null;

  const showRelatedEvents = relatedEvents && relatedEvents?.length > 0;

  return (
    <>
      {/*<ArtistSeoMicrodata artist={artist} />*/}
      <OuterPage>
        <PageHeadline
          title={venue.name}
          segments={[
            { label: "Endemit", path: "" },
            { label: "Venues", path: "venues" },
            { label: venue.name, path: venue.uid },
          ]}
        />
        <div
          className={
            "absolute top-80 h-[400px] blur-3xl -left-10 -right-10 bg-cover opacity-40 z-0 "
          }
          style={
            venue.image
              ? {
                  backgroundImage: `url('${getResizedPrismicImage(venue.image?.src, { width: 400, quality: 50 })}')`,
                }
              : {}
          }
        ></div>
        <div className={"text-neutral-200"}>
          <EventLocation
            venue={{ ...venue, mapLocationUrl: venue.mapUrl ?? "" }}
            logoWidth={"large"}
          />
        </div>
        <Spacer size={"xlarge"} />
        {showRelatedEvents && (
          <InnerPage>
            <h2 className={"text-3xl text-neutral-200"}>
              Events hosted at {venue.name}
            </h2>
            <div
              className={clsx(
                "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 w-full gap-2 mt-8"
              )}
            >
              {showRelatedEvents &&
                relatedEvents.map(event => {
                  const shouldShowLink =
                    event.options.enabledLink ||
                    event.options.externalEventLink;
                  const link =
                    event.options.externalEventLink ?? `/events/${event.uid}`;

                  return (
                    <EventMiniCard
                      location={event.venue?.name}
                      dateStart={event.date_start}
                      dateEnd={event.date_end}
                      key={event.id}
                      image={event.promoImage}
                      name={event.name}
                      link={shouldShowLink ? link : null}
                    />
                  );
                })}
            </div>
          </InnerPage>
        )}

        <EndemitSubscribe
          title={`Don't miss the next event at ${venue.name}`}
          description={"Subscribe and be notified about our events and lineups"}
        />
      </OuterPage>
    </>
  );
}

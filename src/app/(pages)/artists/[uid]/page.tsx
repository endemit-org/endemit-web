import PageHeadline from "@/app/_components/content/PageHeadline";
import InnerPage from "@/app/_components/content/InnerPage";
import OuterPage from "@/app/_components/content/OuterPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";
import { notFound } from "next/navigation";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import { fetchEventsForArtistFromCms } from "@/domain/cms/operations/fetchEventsForArtistFromCms";
import { fetchPodcastsForArtistFromCms } from "@/domain/cms/operations/fetchPodcastsForArtistFromCms";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";
import Spacer from "@/app/_components/content/Spacer";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import clsx from "clsx";
import PodcastCard from "@/app/_components/podcast/PodcastCard";
import EventMiniCard from "@/app/_components/event/EventMiniCard";
import { Metadata } from "next";
import { prismic } from "@/lib/services/prismic";
import ArtistSeoMicrodata from "@/app/_components/seo/ArtistSeoMicrodata";
import { getResizedPrismicImage } from "@/lib/util/util";
import ArtistList from "@/app/_components/artist/ArtistList";

export async function generateStaticParams() {
  const artists = await fetchArtistsFromCms({});

  if (!artists || artists.length === 0) {
    return [];
  }

  return artists.map(artist => ({
    uid: artist.uid,
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
  const artist = await fetchArtistFromCms(uid);

  if (!artist) {
    notFound();
  }

  const title = `${artist.meta.title ?? artist.name} • Artists`;
  const description =
    artist?.meta.description ?? prismic.asText(artist.description) ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: artist.meta.image
        ? [artist.meta.image]
        : artist.image?.src
          ? [artist.image?.src]
          : undefined,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;
  const artist = await fetchArtistFromCms(uid);

  if (!artist || artist.isB2b) {
    notFound();
  }

  const relatedEventsQuery = await fetchEventsForArtistFromCms(artist.id);
  const relatedPodcasts = await fetchPodcastsForArtistFromCms(artist.id);
  const relatedArtistsQuery = await fetchArtistsFromCms({});
  const relatedArtists = relatedArtistsQuery
    ?.filter(a => a.id !== artist.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  const relatedEvents = relatedEventsQuery
    ? relatedEventsQuery.sort((a, b) => {
        if (!a.date_start || !b.date_start) return 0;
        return b.date_start.getTime() - a.date_start.getTime();
      })
    : null;

  const showRelatedPodcasts = relatedPodcasts && relatedPodcasts?.length > 0;
  const showRelatedEvents = relatedEvents && relatedEvents?.length > 0;

  return (
    <>
      <ArtistSeoMicrodata artist={artist} />
      <OuterPage>
        <PageHeadline
          title={artist.name}
          segments={[
            { label: "Endemit", path: "" },
            { label: "Artists", path: "artists" },
            { label: artist.name, path: artist.uid },
          ]}
        />
        <ArtistProfile artist={artist} coverSrc={artist.image?.src} />
        <div
          className={
            "absolute top-80 h-[400px] blur-3xl -left-10 -right-10 bg-cover opacity-40 z-0 "
          }
          style={
            artist.image
              ? {
                  backgroundImage: `url('${getResizedPrismicImage(artist.image?.src, { width: 400, quality: 50 })}')`,
                }
              : {}
          }
        ></div>
        <Spacer size={"xlarge"} />
        {(showRelatedEvents || showRelatedPodcasts) && (
          <InnerPage>
            <h2 className={"text-3xl text-neutral-200"}>
              {artist.name} appears on
            </h2>
            <div
              className={clsx(
                "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 w-full gap-2 mt-8"
              )}
            >
              {showRelatedPodcasts &&
                relatedPodcasts.map(podcast => (
                  <PodcastCard
                    date={podcast.date}
                    episodeNumber={podcast.number}
                    key={podcast.id}
                    image={podcast.cover}
                    name={podcast.name}
                    uid={podcast.uid}
                  />
                ))}
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
        )}{" "}
        {relatedArtists && (
          <>
            <Spacer size={"small"} />
            <h2 className={"text-3xl text-neutral-200"}>
              Explore other artists
            </h2>
            <ArtistList artists={relatedArtists} />
          </>
        )}
        <Spacer size={"small"} />
        <EndemitSubscribe
          title={`Don't miss ${artist.name} next time`}
          description={"Subscribe and be notified about our events and lineups"}
        />
      </OuterPage>
    </>
  );
}

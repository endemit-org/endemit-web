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

export async function generateStaticParams() {
  const artists = await fetchArtistsFromCms({});

  if (!artists || artists.length === 0) {
    return [];
  }

  return artists.map(artist => ({
    uid: artist.uid,
  }));
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

  if (!artist) {
    notFound();
  }

  const relatedEvents = await fetchEventsForArtistFromCms(artist.id);
  const relatedPodcasts = await fetchPodcastsForArtistFromCms(artist.id);

  return (
    <OuterPage>
      <div
        className={
          "absolute top-80 h-[400px] blur-3xl -left-10 -right-10 bg-cover opacity-40 "
        }
        style={{
          backgroundImage: `url(${artist.image?.src})`,
        }}
      ></div>

      <PageHeadline
        title={artist.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Artists", path: "artists" },
          { label: artist.name, path: artist.uid },
        ]}
      />
      <ArtistProfile artist={artist} coverSrc={artist.image?.src} />
      <Spacer size={"xlarge"} />

      <InnerPage>
        <div
          className={clsx(
            "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 w-full gap-2"
          )}
        >
          {relatedPodcasts &&
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
          {relatedEvents &&
            relatedEvents.map(event => (
              <EventMiniCard
                location={event.venue?.name}
                date={event.date_start}
                key={event.id}
                image={event.promoImage}
                name={event.name}
                uid={event.uid}
              />
            ))}
        </div>
      </InnerPage>
      <Spacer size={"small"} />
      <EndemitSubscribe
        title={`Don't miss ${artist.name} next time`}
        description={"Subscribe and be notified about our events and lineups"}
      />
    </OuterPage>
  );
}

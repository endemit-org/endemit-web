import PageHeadline from "@/app/_components/content/PageHeadline";
import InnerPage from "@/app/_components/content/InnerPage";
import OuterPage from "@/app/_components/content/OuterPage";
import { fetchArtistFromCms } from "@/domain/cms/operations/fetchArtistFromCms";
import { notFound } from "next/navigation";
import { fetchArtistsFromCms } from "@/domain/cms/operations/fetchArtistsFromCms";
import { fetchEventsForArtistFromCms } from "@/domain/cms/operations/fetchEventsForArtistFromCms";
import { fetchPodcastsForArtistFromCms } from "@/domain/cms/operations/fetchPodcastsForArtistFromCms";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";

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
      <PageHeadline
        title={artist.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Artists", path: "artists" },
          { label: artist.name, path: artist.uid },
        ]}
      />
      <ArtistProfile artist={artist} coverSrc={artist.image?.src} />
      <InnerPage>
        {relatedEvents &&
          relatedEvents.map(event => <div key={event.id}>{event.name}</div>)}

        {relatedPodcasts &&
          relatedPodcasts.map(podcast => (
            <div key={podcast.id}>{podcast.name}</div>
          ))}
      </InnerPage>
    </OuterPage>
  );
}

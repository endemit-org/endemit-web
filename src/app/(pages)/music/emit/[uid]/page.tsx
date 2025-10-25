import PageHeadline from "@/app/_components/content/PageHeadline";
import OuterPage from "@/app/_components/content/OuterPage";
import { notFound } from "next/navigation";
import PodcastEpisodeHero from "@/app/_components/podcast/PodcastEpisodeHero";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";
import PodcastSection from "@/app/_components/podcast/PodcastSection";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import Spacer from "@/app/_components/content/Spacer";
import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";
import { fetchPodcastFromCms } from "@/domain/cms/operations/fetchPodcastFromCms";

export async function generateStaticParams() {
  const podcasts = await fetchPodcastsFromCms({});

  if (!podcasts || podcasts.length === 0) {
    return [];
  }

  return podcasts.map(podcast => ({
    uid: podcast.uid,
  }));
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{
    uid: string;
  }>;
}) {
  const { uid } = await params;

  const podcast = await fetchPodcastFromCms(uid);

  if (!podcast) {
    notFound();
  }

  const otherPodcasts = await fetchPodcastsFromCms({});
  const filteredPodcast =
    otherPodcasts &&
    otherPodcasts.length > 0 &&
    otherPodcasts
      .filter(otherPodcast => otherPodcast.id !== podcast.id)
      .slice(0, 4);

  return (
    <OuterPage>
      <PageHeadline
        title={podcast.name}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Music", path: "music" },
          { label: podcast.name, path: `emit/${uid}` },
        ]}
      />
      <div>
        <PodcastEpisodeHero
          number={podcast.number}
          coverSrc={podcast.cover?.src}
          description={podcast.description}
          trackUrl={podcast.track.url}
          trackApiUrl={podcast.track.apiUrl}
          uid={podcast.uid}
        />

        {podcast.artist && (
          <ArtistProfile
            artist={podcast.artist}
            coverSrc={podcast.cover?.src}
          />
        )}
      </div>

      {filteredPodcast && (
        <PodcastSection
          title={"Enjoy our latest episodes"}
          podcasts={filteredPodcast}
        />
      )}

      <Spacer size={"small"} />
      <EndemitSubscribe
        title={"Dont miss out our next episode"}
        description={
          "Subscribe and be notified when we release a new emit episode"
        }
      />
    </OuterPage>
  );
}

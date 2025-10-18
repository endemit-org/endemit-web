import {
  fetchPodcastFromCms,
  fetchPodcastsFromCms,
} from "@/domain/cms/actions";
import PageHeadline from "@/components/content/PageHeadline";
import OuterPage from "@/components/content/OuterPage";
import { notFound } from "next/navigation";
import PodcastEpisodeHero from "@/components/podcast/PodcastEpisodeHero";
import PodcastArtistSection from "@/components/podcast/PodcastArtistSection";
import PodcastSection from "@/components/podcast/PodcastSection";
import EndemitSubscribe from "@/components/newsletter/EndemitSubscribe";
import Spacer from "@/components/content/Spacer";

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
          <PodcastArtistSection
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

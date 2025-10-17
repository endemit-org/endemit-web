import {
  fetchPodcastFromCms,
  fetchPodcastsFromCms,
} from "@/domain/cms/actions";
import PageHeadline from "@/components/PageHeadline";
import OuterPage from "@/components/OuterPage";
import { notFound } from "next/navigation";
import PodcastEpisodeHero from "@/components/podcast/PodcastEpisodeHero";
import PodcastArtistSection from "@/components/podcast/PodcastArtistSection";
import RelatedPodcastsSection from "@/components/podcast/RelatedPodcastsSection";

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

      {filteredPodcast && <RelatedPodcastsSection podcasts={filteredPodcast} />}
    </OuterPage>
  );
}

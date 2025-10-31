import PageHeadline from "@/app/_components/ui/PageHeadline";
import OuterPage from "@/app/_components/ui/OuterPage";
import { notFound } from "next/navigation";
import PodcastEpisodeHero from "@/app/_components/podcast/PodcastEpisodeHero";
import ArtistProfile from "@/app/_components/artist/ArtistProfile";
import PodcastSection from "@/app/_components/podcast/PodcastSection";
import EndemitSubscribe from "@/app/_components/newsletter/EndemitSubscribe";
import Spacer from "@/app/_components/content/Spacer";
import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";
import { fetchPodcastFromCms } from "@/domain/cms/operations/fetchPodcastFromCms";
import { Metadata } from "next";
import { prismic } from "@/lib/services/prismic";
import PodcastEpisodeSeoMicrodata from "@/app/_components/seo/PodcastEpisodeSeoMicrodata";
import { buildOpenGraphImages } from "@/lib/util/seo";

export async function generateStaticParams() {
  const podcasts = await fetchPodcastsFromCms({});

  if (!podcasts || podcasts.length === 0) {
    return [];
  }

  return podcasts.map(podcast => ({
    uid: podcast.uid,
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
  const podcast = await fetchPodcastFromCms(uid);

  if (!podcast) {
    notFound();
  }

  const title = `${podcast.meta.title ?? podcast.name} • Music`;
  const description =
    podcast?.meta.description ??
    prismic.asText(podcast.description) ??
    undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: buildOpenGraphImages({
        metaImage: podcast.meta.image,
        fallbackImages: podcast.cover?.src ? [podcast.cover.src] : undefined,
      }),
    },
  };
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
    <>
      <PodcastEpisodeSeoMicrodata podcast={podcast} />
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
            footnote={podcast.footnote}
            description={podcast.description}
            trackUrl={podcast.track.url}
            tracklist={podcast.tracklist}
          />

          {podcast.artist && (
            <ArtistProfile
              artist={podcast.artist}
              coverSrc={podcast.cover?.src}
              showLinkToPage={true}
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
      </OuterPage>{" "}
    </>
  );
}

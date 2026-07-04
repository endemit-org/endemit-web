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
import { buildOpenGraphImages, buildOpenGraphObject } from "@/lib/util/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Static until next deploy - no ISR
export const revalidate = false;

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
    locale: string;
    uid: string;
  }>;
}): Promise<Metadata> {
  const { locale, uid } = await params;
  const loc = locale === "en" ? "en" : "sl";
  const podcast = await fetchPodcastFromCms(uid, { locale: loc });

  if (!podcast) {
    notFound();
  }

  const title = `${podcast.meta.title ?? podcast.name} • Music`;
  const description =
    podcast?.meta.description ??
    prismic.asText(podcast.description) ??
    undefined;
  const images = buildOpenGraphImages({
    metaImage: podcast.meta.image,
    fallbackImages: podcast.cover?.src ? [podcast.cover.src] : undefined,
  });
  const url = `https://endemit.org/music/emit/${uid}`;

  return buildOpenGraphObject({ title, description, images, url, type: "music.song" });
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{
    locale: string;
    uid: string;
  }>;
}) {
  const { locale, uid } = await params;
  setRequestLocale(locale as "sl" | "en");
  const loc = locale === "en" ? "en" : "sl";
  const t = await getTranslations("music");
  const podcast = await fetchPodcastFromCms(uid, { locale: loc });

  if (!podcast) {
    notFound();
  }

  const otherPodcasts = await fetchPodcastsFromCms({ locale: loc });
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
            { label: t("breadcrumb"), path: "music" },
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
            artist={podcast.artist?.name}
            date={podcast.date}
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
            title={t("latestEpisodes")}
            podcasts={filteredPodcast}
          />
        )}

        <Spacer size={"small"} />
        <EndemitSubscribe
          title={t("dontMissNextEpisode")}
          description={t("subscribeNewEpisode")}
        />
      </OuterPage>{" "}
    </>
  );
}

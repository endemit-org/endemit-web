import { FC } from "react";
import { Content, isFilled } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import clsx from "clsx";

import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";
import { fetchPodcastFromCms } from "@/domain/cms/operations/fetchPodcastFromCms";
import PodcastSeriesSeoMicrodata from "@/app/_components/seo/PodcastSeriesSeoMicrodata";
import PlayablePodcastCard from "@/app/_components/podcast/PlayablePodcastCard";
import FeaturedPodcastCard from "@/app/_components/podcast/FeaturedPodcastCard";

/**
 * Props for `PodcastList`.
 */
export type PodcastListProps = SliceComponentProps<Content.PodcastListSlice>;

/**
 * Component for "PodcastList" Slices.
 */
const PodcastList: FC<PodcastListProps> = async ({ slice }) => {
  // Grid variation - show 2, 4, or all episodes
  if (slice.variation === "default") {
    const episodeCountValue = slice.primary.episode_count ?? "4";
    const isAll = episodeCountValue === "all";
    const episodeCount = isAll ? 200 : parseInt(episodeCountValue, 10);
    const podcasts = await fetchPodcastsFromCms({ pageSize: episodeCount });

    if (!podcasts || podcasts.length === 0) {
      return null;
    }

    const limitedPodcasts = isAll ? podcasts : podcasts.slice(0, episodeCount);

    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className={clsx(
          slice.primary.render_frame &&
            "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md"
        )}
      >
        <PodcastSeriesSeoMicrodata />

        {slice.primary.title && (
          <h2 className="text-3xl text-neutral-200">{slice.primary.title}</h2>
        )}
        {slice.primary.description && (
          <p className="text-md text-neutral-400">
            {slice.primary.description}
          </p>
        )}

        <div
          className={clsx(
            "grid gap-2 w-full",
            episodeCountValue === "2"
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
            (slice.primary.title || slice.primary.description) && "mt-8"
          )}
        >
          {limitedPodcasts.map(podcast => (
            <PlayablePodcastCard
              key={podcast.id}
              uid={podcast.uid}
              name={podcast.name}
              episodeNumber={podcast.number}
              date={podcast.date}
              image={podcast.tile ?? podcast.cover}
              trackUrl={podcast.track.url}
              artist={podcast.artist?.name}
            />
          ))}
        </div>
      </section>
    );
  }

  // Featured variation - show single episode
  if (slice.variation === "featured") {
    let podcast = null;

    if (slice.primary.use_latest) {
      // Fetch latest episode
      const podcasts = await fetchPodcastsFromCms({ pageSize: 1 });
      podcast = podcasts?.[0] ?? null;
    } else if (isFilled.contentRelationship(slice.primary.selected_episode)) {
      // Fetch selected episode
      const selectedUid = slice.primary.selected_episode.uid;
      if (selectedUid) {
        podcast = await fetchPodcastFromCms(selectedUid);
      }
    }

    if (!podcast) {
      return null;
    }

    return (
      <section
        data-slice-type={slice.slice_type}
        data-slice-variation={slice.variation}
        className={clsx(
          slice.primary.render_frame &&
            "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md"
        )}
      >
        {slice.primary.title && (
          <h2 className="text-3xl text-neutral-200 mb-2">
            {slice.primary.title}
          </h2>
        )}
        {slice.primary.description && (
          <p className="text-md text-neutral-400 mb-6">
            {slice.primary.description}
          </p>
        )}

        <FeaturedPodcastCard
          uid={podcast.uid}
          name={podcast.name}
          episodeNumber={podcast.number}
          image={podcast.tile ?? podcast.cover}
          trackUrl={podcast.track.url}
          artist={podcast.artist?.name}
        />
      </section>
    );
  }

  return null;
};

export default PodcastList;

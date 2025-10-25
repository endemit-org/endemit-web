import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

import PodcastSection from "@/app/_components/podcast/PodcastSection";
import { fetchPodcastsFromCms } from "@/domain/cms/operations/fetchPodcastsFromCms";

/**
 * Props for `PodcastList`.
 */
export type PodcastListProps = SliceComponentProps<Content.PodcastListSlice>;

/**
 * Component for "PodcastList" Slices.
 */
const PodcastList: FC<PodcastListProps> = async ({ slice }) => {
  let podcasts = null;

  if (slice.variation === "default") {
    podcasts = await fetchPodcastsFromCms({});
  }

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      {podcasts && podcasts.length > 0 && (
        <PodcastSection
          podcasts={podcasts}
          title={slice.primary.title ?? undefined}
          description={slice.primary.description ?? undefined}
          renderFrame={slice.primary.render_frame ?? false}
        />
      )}
    </section>
  );
};

export default PodcastList;

import clsx from "clsx";
import { Podcast } from "@/domain/podcast/types/podcast";
import PodcastCard from "@/components/podcast/PodcastCard";

interface Props {
  podcasts: Podcast[];
  title?: string;
  description?: string;
  renderFrame?: boolean;
}

export default function PodcastSection({
  podcasts,
  title,
  description,
  renderFrame = true,
}: Props) {
  if (podcasts.length === 0) {
    return;
  }

  return (
    <section
      className={clsx(
        renderFrame && "p-4 lg:p-10 max-lg:py-8 bg-neutral-800 rounded-md",
        !renderFrame && "py-8"
      )}
    >
      {title && <h2 className={"text-3xl text-neutral-200"}>{title}</h2>}
      {description && (
        <p className={"text-md text-neutral-400"}>{description}</p>
      )}

      <div
        className={clsx(
          "flex gap-0.5 flex-wrap w-full",
          title || description ? "mt-8" : "mt-0"
        )}
      >
        {podcasts.map(podcast => (
          <PodcastCard
            date={podcast.date}
            episodeNumber={podcast.number}
            key={podcast.id}
            image={podcast.cover}
            name={podcast.name}
            uid={podcast.uid}
          />
        ))}
      </div>
    </section>
  );
}

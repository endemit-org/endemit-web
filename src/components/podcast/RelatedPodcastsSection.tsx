import InnerPage from "@/components/InnerPage";
import PodcastCard from "@/components/podcast/PodcastCard";

interface PodcastImage {
  src: string;
  alt?: string | null;
}

interface RelatedPodcast {
  id: string;
  uid: string;
  name: string;
  number: string;
  date: Date | null;
  cover: PodcastImage | null;
}

interface RelatedPodcastsSectionProps {
  podcasts: RelatedPodcast[];
}

export default function RelatedPodcastsSection({
  podcasts,
}: RelatedPodcastsSectionProps) {
  if (!podcasts || podcasts.length === 0) {
    return null;
  }

  return (
    <div className="mb-10 text-center">
      <InnerPage>
        <h3 className="text-neutral-200 text-2xl pb-6">
          Enjoy these episodes as well
        </h3>
        <div className="flex gap-0.5 flex-wrap">
          {podcasts.map((relatedPodcast, index) => (
            <PodcastCard
              key={`related-podcast-${index}-${relatedPodcast.id}`}
              date={relatedPodcast.date}
              episodeNumber={relatedPodcast.number}
              image={relatedPodcast.cover}
              name={relatedPodcast.name}
              uid={relatedPodcast.uid}
            />
          ))}
        </div>
      </InnerPage>
    </div>
  );
}

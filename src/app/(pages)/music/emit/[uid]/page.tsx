import {
  fetchPodcastFromCms,
  fetchPodcastsFromCms,
} from "@/domain/cms/actions";
import PageHeadline from "@/components/PageHeadline";
import OuterPage from "@/components/OuterPage";
import InnerPage from "@/components/InnerPage";
import SoundCloudEmbed from "@/components/SoundCloudEmbed";
import PodcastCard from "@/components/podcast/PodcastCard";
import Image from "next/image";
import { notFound } from "next/navigation";

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
      .filter(otherPodcast => {
        return otherPodcast.id !== podcast.id;
      })
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
      <div className={"w-full min-h-96 relative  flex gap-x-6"}>
        <div
          className={"absolute w-full blur-3xl inset h-full"}
          style={{
            backgroundImage: `url('${podcast.cover?.src}')`,
            backgroundRepeat: "repeat",
            backgroundBlendMode: "color-burn",
            backgroundSize: "1500px",
          }}
        ></div>
        <div className={"relative text-neutral-200 w-3/5"}>
          <h2 className={"text-2xl mb-6"}>About this episode</h2>
          {`Emit is Endemit's curated podcast series - a sonic chronicle of the collective's underground techno culture. More than just a mix series, it serves as both archive and amplifier for the Endemit sound.
Each episode captures either a live recording from an Endemit event, preserving the raw energy of the moment, or a specially crafted studio mix that represents the artist's current sonic exploration. The series features residents, international guests who've graced Endemit events, and emerging regional talents who align with the collective's vision of forward-thinking, hypnotic techno.`}
        </div>
        <div className={"relative"}>
          <h2 className={"text-2xl mb-6"}>About {podcast.artist?.name}</h2>
          {podcast.artist?.image && (
            <Image
              src={podcast.artist?.image?.src}
              alt={podcast.artist?.image?.alt ?? podcast.artist?.name}
              width={300}
              height={300}
            />
          )}
          {podcast.artist?.description}
          {podcast.artist?.links &&
            podcast.artist?.links.map((link, index) => (
              <div key={`artist-link-${index}`}>
                {link.type} {link.url}
              </div>
            ))}
        </div>
      </div>

      <InnerPage>
        <h2 className={"text-2xl"}>Listen to the episode</h2>
        <SoundCloudEmbed
          key={podcast.uid}
          trackTitle={podcast.description}
          trackUrl={podcast.track.url}
          trackTitleUrl={podcast.track.apiUrl}
        />
      </InnerPage>
      {filteredPodcast && filteredPodcast.length > 0 && (
        <div className="mt-20 mb-10 text-center">
          <h3 className={"text-neutral-200 text-2xl py-6"}>
            Enjoy these episodes as well
          </h3>
          <div className={"flex gap-0.5 flex-wrap"}>
            {filteredPodcast.map((relatedPodcast, index) => (
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
        </div>
      )}
    </OuterPage>
  );
}

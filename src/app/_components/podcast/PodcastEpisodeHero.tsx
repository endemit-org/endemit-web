import InnerPage from "@/app/_components/content/InnerPage";
import SoundCloudEmbed from "@/app/_components/content/SoundCloudEmbed";

interface PodcastEpisodeHeroProps {
  number: string;
  coverSrc?: string;
  description: string;
  trackUrl: string;
  trackApiUrl: string;
  uid: string;
}

const EMIT_DESCRIPTION = `Emit is Endemit's curated podcast series - a sonic chronicle of the collective's underground techno culture. More than just a mix series, it serves as both archive and amplifier for the Endemit sound.
Each episode captures either a live recording from an Endemit event, preserving the raw energy of the moment, or a specially crafted studio mix that represents the artist's current sonic exploration. The series features residents, international guests who've graced Endemit events, and emerging regional talents who align with the collective's vision of forward-thinking, hypnotic techno.`;

export default function PodcastEpisodeHero({
  number,
  coverSrc,
  description,
  trackUrl,
  trackApiUrl,
  uid,
}: PodcastEpisodeHeroProps) {
  return (
    <div className="w-full min-h-96 relative flex gap-x-24 max-xl:flex-col max-xl:gap-y-12 mb-20">
      <div
        className="absolute w-full blur-3xl inset h-full"
        style={{
          backgroundImage: `url('${coverSrc}')`,
          backgroundRepeat: "repeat",
          backgroundBlendMode: "color-burn",
          backgroundSize: "1500px",
        }}
      />
      <div className="relative text-neutral-200 flex-1">
        <h3 className="text-[#d31c18] text-8xl mb-0 pb-0 mix-blend-difference">
          {number}
        </h3>
        <h2 className="text-2xl mb-6 -mt-4 pt-0">About this episode</h2>
        {EMIT_DESCRIPTION}
      </div>
      <div className="relative w-full xl:w-2/5">
        <InnerPage>
          <h2 className="text-2xl">Listen to the episode</h2>
          <SoundCloudEmbed
            key={uid}
            trackTitle={description}
            trackUrl={trackUrl}
            trackTitleUrl={trackApiUrl}
          />
        </InnerPage>
      </div>
    </div>
  );
}

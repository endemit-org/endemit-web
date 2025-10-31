import InnerPage from "@/app/_components/ui/InnerPage";
import EmbedSoundCloud from "@/app/_components/content/EmbedSoundCloud";
import { RichTextField } from "@prismicio/client";
import RichTextDisplay from "@/app/_components/content/RichTextDisplay";
import { PodcastTrackInList } from "@/domain/podcast/types/podcast";
import clsx from "clsx";
import { getResizedPrismicImage } from "@/lib/util/util";

interface PodcastEpisodeHeroProps {
  number: string;
  coverSrc?: string;
  description: RichTextField | null;
  footnote?: string;
  trackUrl: string;
  tracklist: PodcastTrackInList[] | null;
}
export default function PodcastEpisodeHero({
  number,
  coverSrc,
  description,
  trackUrl,
  tracklist,
  footnote,
}: PodcastEpisodeHeroProps) {
  return (
    <div className="w-full min-h-96 relative flex gap-x-24 max-xl:flex-col max-xl:gap-y-12 mb-20">
      <div
        className="absolute w-full blur-3xl inset h-full"
        style={
          coverSrc
            ? {
                backgroundImage: `url('${getResizedPrismicImage(coverSrc, { width: 400, quality: 50 })}')`,
                backgroundRepeat: "repeat",
                backgroundBlendMode: "color-burn",
                backgroundSize: "1500px",
              }
            : {}
        }
      />
      <div className="relative text-neutral-200 flex-1">
        <h3 className="text-[#d31c18] text-8xl mb-0 pb-0 mix-blend-difference">
          {number}
        </h3>
        <h2 className="text-2xl mb-6 -mt-4 pt-0">About this episode</h2>
        <RichTextDisplay richText={description} />
      </div>
      <div className="relative w-full xl:w-2/5">
        <InnerPage>
          <h2 className="text-2xl">Listen to the episode</h2>
          <EmbedSoundCloud url={trackUrl} height={166} />
          {footnote && (
            <div className={"text-xs text-neutral-400 mt-2"}>{footnote}</div>
          )}
          {tracklist && tracklist.length > 0 && (
            <div className="mt-6">
              <span className={"font-heading uppercase text-2xl"}>
                Tracklist
              </span>
              <div className="list-decimal max-h-40 overflow-y-auto mt-3 scrollbar-thin scrollbar-track-neutral-800 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500">
                {tracklist.map((track, index) => (
                  <div
                    key={track.title}
                    className={
                      " flex items-center gap-x-3 hover:bg-neutral-200/20 py-1.5"
                    }
                  >
                    <div
                      className={clsx(
                        "text-xl w-8 pl-3",
                        index % 2 === 1 && "text-neutral-600"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={clsx(
                        "border-l-2 border-l-neutral-400 pl-4",
                        index % 2 === 1 && "border-l-neutral-600"
                      )}
                    >
                      <span className={"block text-xs font-thin"}>
                        {track.timestamp && (
                          <span className={"text-blue-600 mr-2"}>
                            @{track.timestamp}
                          </span>
                        )}
                        {track.artist}
                      </span>
                      <span className={"text-sm"}>{track.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </InnerPage>
      </div>
    </div>
  );
}

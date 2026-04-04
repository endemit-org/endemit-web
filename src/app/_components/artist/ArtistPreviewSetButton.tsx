"use client";

import { usePlayerStore } from "@/app/_stores/PlayerStore";
import PlayIcon from "@/app/_components/icon/PlayIcon";

interface Props {
  soundcloudUrl: string;
  artistName: string;
  artistImage?: string;
}

export default function ArtistPreviewSetButton({
  soundcloudUrl,
  artistName,
  artistImage,
}: Props) {
  const loadTrack = usePlayerStore(state => state.loadTrack);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);

  const isCurrentlyPlaying = currentTrack?.url === soundcloudUrl && isPlaying;

  const handlePlay = () => {
    loadTrack({
      url: soundcloudUrl,
      title: `${artistName} - `,
      type: "track",
      image: artistImage,
      artist: artistName,
    });
  };

  return (
    <button
      onClick={handlePlay}
      className={`flex items-center gap-2 text-md transition-colors group ${
        isCurrentlyPlaying
          ? "text-blue-400"
          : "text-neutral-200 hover:text-neutral-300"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          isCurrentlyPlaying
            ? "bg-blue-500"
            : "bg-blue-800 group-hover:bg-blue-700"
        }`}
      >
        {isCurrentlyPlaying ? (
          <span className="flex items-center gap-0.5">
            <span className="w-0.5 h-2 bg-white rounded-full animate-pulse" />
            <span
              className="w-0.5 h-3 bg-white rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="w-0.5 h-2 bg-white rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </span>
        ) : (
          <PlayIcon className="w-3 h-3 ml-0.5" />
        )}
      </span>
      <span className="underline underline-offset-4 decoration-dotted">
        {isCurrentlyPlaying ? `Now playing ${artistName}` : `Play a set from ${artistName}`}
      </span>
    </button>
  );
}

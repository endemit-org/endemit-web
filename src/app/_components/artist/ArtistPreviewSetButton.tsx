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
      className="flex items-center gap-2 text-md text-neutral-200 hover:text-neutral-300 transition-colors group"
    >
      <span className="w-6 h-6 rounded-full bg-blue-800 group-hover:bg-blue-700 flex items-center justify-center transition-colors">
        <PlayIcon className="w-3 h-3 ml-0.5" />
      </span>
      <span className="underline underline-offset-4 decoration-dotted">
        Play a set from {artistName}
      </span>
    </button>
  );
}

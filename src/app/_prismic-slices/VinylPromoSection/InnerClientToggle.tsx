"use client";

import { useState } from "react";
import clsx from "clsx";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import PlayIcon from "@/app/_components/icon/PlayIcon";
import { usePlayerStore } from "@/app/_stores/PlayerStore";
import ActionButton from "@/app/_components/form/ActionButton";

type Props = {
  placeholder: string;
};

export default function InnerClientToggle({ placeholder }: Props) {
  const [isClicked, setIsClicked] = useState(false);
  const loadTrack = usePlayerStore(state => state.loadTrack);
  const loadedTrack = usePlayerStore(state => state.currentTrack);
  const albumTrack = "https://soundcloud.com/ende-mit/sets/mmali-issun-boshi";
  const coverImage =
    "/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp";
  const isAlbumLoaded = loadedTrack?.title && loadedTrack?.url === albumTrack;

  const trackList = [
    {
      title: "Inori 祈り",
      artist: "MMali",
      cover: coverImage,
      url: "https://soundcloud.com/ende-mit/mmali-inori?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Gensō 幻想",
      artist: "MMali",
      cover: coverImage,
      url: "https://soundcloud.com/ende-mit/mmali-genso?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Matsuri 祭 (Inland Endemit Dub)",
      artist: "MMali, Inland",
      cover: coverImage,
      url: "https://soundcloud.com/ende-mit/mmali-matsuri-inland-endemit-dub?in=ende-mit/sets/mmali-issun-boshi",
    },
    {
      title: "Matsuri 祭",
      artist: "MMali",
      cover: coverImage,
      url: "https://soundcloud.com/ende-mit/mmali-matsuri?in=ende-mit/sets/mmali-issun-boshi",
    },
  ];

  return (
    <div className="relative overflow-hidden z-20">
      <ImageWithFallback
        src={coverImage}
        alt="Issun-bōshi Vinyl release"
        width={400}
        height={400}
        className="z-10 relative "
        onClick={() => setIsClicked(!isClicked)}
        placeholder={placeholder}
      />
      <div
        className={clsx(
          "absolute bottom-0 z-10 w-full p-3   transition-transform duration-300 ease-in-out opacity-95",
          isClicked && "translate-y-6 max-lg:translate-y-24",
          !isClicked && "group-hover:translate-y-[85%] translate-y-[87%]"
        )}
      >
        <div
          className={clsx(
            "bg-[#2f284585] rounded-t-md p-1 text-center  transition-opacity duration-300 font-heading uppercase text-xl backdrop-blur-lg cursor-pointer",
            isClicked && "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsClicked(true)}
        >
          <span className={"animate-pulse tracking-wider"}>
            Click here to listen
          </span>
        </div>
        <div className={"relative"}>
          <div
            className={clsx(
              "cursor-pointer bg-neutral-800 text-neutral-200 w-5 h-5 text-center absolute -top-2 -right-2 rounded-full text-md leading-[20px] font-heading transition-transform z-10",
              isClicked && "translate-y-0",
              !isClicked && "translate-y-[500px]"
            )}
            onClick={() => setIsClicked(false)}
          >
            x
          </div>
          <div
            className={
              "h-[300px] bg-neutral-200/90 backdrop-blur-lg rounded-lg "
            }
          >
            <div className={"w-full flex flex-col gap-y-3 p-4"}>
              {trackList.map(track => {
                const isCurrentTrackLoaded =
                  loadedTrack?.title && loadedTrack?.url === track.url;

                return (
                  <div
                    key={`custom-promo-${track.title}`}
                    className={
                      "flex text-neutral-900 cursor-pointer hover:opacity-80 gap-2 items-center"
                    }
                    onClick={() =>
                      loadTrack({
                        url: track.url,
                        title: track.title,
                        type: "track",
                        image: track.cover,
                        artist: track.artist,
                      })
                    }
                  >
                    <div
                      className={`rounded-full size-7 bg-blue-600 shrink-0 ${isCurrentTrackLoaded ? "animate-pulse" : ""}`}
                    >
                      <PlayIcon
                        fill
                        className={`text-neutral-200 size-4 m-auto mt-1.5 ml-1.5 `}
                      />
                    </div>
                    <ImageWithFallback
                      src={track.cover}
                      alt={track.title}
                      width={30}
                      height={30}
                      className={"size-10 rounded-md"}
                    />
                    <div className={"w-full "}>
                      {track.title}
                      <div className={"text-xs text-neutral-600"}>
                        {track.artist}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={"px-4"}>
              <ActionButton
                size={"sm"}
                onClick={() =>
                  loadTrack({
                    url: albumTrack,
                    title: "Issun-bōshi",
                    type: "track",
                    image: coverImage,
                    artist: "MMali",
                  })
                }
                disabled={!!isAlbumLoaded}
              >
                <PlayIcon
                  fill
                  className={`text-white size-5 mr-2 ${isAlbumLoaded ? "animate-pulse" : ""}`}
                />
                {isAlbumLoaded ? "Playing album" : "Play album"}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

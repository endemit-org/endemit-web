"use client";

import Image from "next/image";
import EmbedSoundCloud from "@/app/_components/content/EmbedSoundCloud";
import { useState } from "react";
import clsx from "clsx";

export default function InnerClientToggle() {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className="relative overflow-hidden z-20">
      <Image
        src="/images/issun-boshi-vinyl-release/album/issun-boshi-cover.webp"
        alt="Issun-bōshi  Vinyl release"
        width={400}
        height={400}
        className="z-10 relative "
        onClick={() => setIsClicked(!isClicked)}
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
              "cursor-pointer bg-neutral-800 text-neutral-200 w-5 h-5 text-center absolute -top-2 -right-2 rounded-full text-md leading-[20px] font-heading transition-transform",
              isClicked && "translate-y-0",
              !isClicked && "translate-y-[500px]"
            )}
            onClick={() => setIsClicked(false)}
          >
            x
          </div>
          <EmbedSoundCloud
            url={"https://soundcloud.com/ende-mit/sets/mmali-issun-boshi"}
            height={350}
          />
        </div>
      </div>
    </div>
  );
}
